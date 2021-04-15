/////////////////////////////////////////////////////////////
// CONSTANTS, MODULES & DEPENDENCIES ------------------------
/////////////////////////////////////////////////////////////
const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const methodOverride = require('method-override');
const { generateRandomString, urlsForUser, validateLogin, validateRegister, validateResource} = require('./helpers');

/////////////////////////////////////////////////////////////
// APP & MIDDLEWARE USE -------------------------------------
/////////////////////////////////////////////////////////////
const app = express();
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");

/////////////////////////////////////////////////////////////
// DATABASES ------------------------------------------------
/////////////////////////////////////////////////////////////
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", saltRounds)
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "user3@example.com",
    password: bcrypt.hashSync("123456", saltRounds)
  }
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
  b2xVn2: {
    longURL: "http://www.netflix.com",
    userID: "userRandomID"
  },
  sgq3y6: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  }
};

/////////////////////////////////////////////////////////////
// GET REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// READ: Redirect to display all the URLs if user goes to root
app.get("/", (req, res) => {
  const userID = req.session['user_id'];
  if (userID) {
    res.redirect(`/urls`);
  } else {
    res.redirect(`/login`);
  }
});

// READ: Display all the URLs and their shortened forms
app.get("/urls", (req, res) => {
  const userID = req.session['user_id'];

  // If user is not logged in
  if (!userID) {
    res.status(401);
    const templateVars = {
      user: null,
      error: {
        statusCode: "401",
        message: "Unauthorised access. You need to log in or register."
      }
    };
    res.render("error", templateVars);
    return;
  }

  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[userID],
    urls: userURLs
  };

  res.render("urls_index", templateVars);
});

// READ: Display basic form page that allows user to submit URLs to be shortened
// Needs to be before /urls/:shortURL endpoint otherwise Express will think new is a route parameter
app.get("/urls/new", (req, res) => {
  const userID = req.session['user_id'];
  
  if (!userID) {
    res.redirect(`/login`);
    return;
  }
  
  const templateVars = {
    user: users[userID],
  };
  res.render("urls_new", templateVars);
});

// READ: Display a single URL and its shortened form along with a form to update a specific existing shortened URL in database
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;

  // Check if resource exists
  const resourceError = validateResource(shortURL, urlDatabase);
  if (resourceError) {
    const templateVars = { error: resourceError, user: users[userID] };
    res.status(resourceError.statusCode);
    res.render("error", templateVars);
    return;
  }

  // If user is not logged in
  if (!userID) {
    res.status(401);
    const templateVars = {
      user: null,
      error: {
        statusCode: "401",
        message: "Unauthorised access. You need to log in or register."
      }
    };
    res.render("error", templateVars);
    return;
  }

  // If user is logged in, check if shortURL belongs to current user
  const longURL = urlDatabase[shortURL].longURL;
  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) {
    res.status(403);
    const templateVars = {
      user: users[userID],
      error: {
        statusCode: "403",
        message: "Unauthorised access."
      }
    };
    res.render("error", templateVars);
    return;
  }
  
  const templateVars = {
    user: users[userID],
    shortURL,
    longURL
  };

  res.render("urls_show", templateVars);
});

// READ: Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;

  // Check if resource exists
  const resourceError = validateResource(shortURL, urlDatabase);
  if (resourceError) {
    const templateVars = { error: resourceError, user: users[userID] };
    res.status(resourceError.statusCode);
    res.render("error", templateVars);
    return;
  }

  // // Check if resource exists
  // if (!urlDatabase[shortURL]) {
  //   res.status(404);
  //   const templateVars = {
  //     user: users[userID],
  //     error: {
  //       statusCode: "404",
  //       message: "ShortURL not found."
  //     }
  //   };
  //   res.render("error", templateVars);
  //   return;
  // }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// READ: Display registration form
app.get("/register", (req, res) => {
  const userID = req.session['user_id'];

  // Redirect user to urls index if they're already logged in;
  if (userID) {
    res.redirect(`/urls`);
    return;
  }

  const templateVars = { user: null };
  res.render("register", templateVars);
});

// READ: Display login form
app.get("/login", (req, res) => {
  const userID = req.session['user_id'];

  // Redirect user to urls index if they're already logged in;
  if (userID) {
    res.redirect(`/urls`);
    return;
  }

  const templateVars = { user: null };
  res.render("login", templateVars);
});

// READ: For development purposes - JSON string representing the entire urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// READ: For development purposes - JSON string representing the entire users object
app.get("/users.json", (req, res) => {
  res.json(users);
});

/////////////////////////////////////////////////////////////
// POST REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// CREATE/POST: Handle the form submission to add the long URL to the database with an associated random shortURL and the current user
app.post("/urls", (req, res) => {
  const userID = req.session['user_id'];

  // If user is not logged in
  if (!userID) {
    res.status(401);
    const templateVars = {
      user: null,
      error: {
        statusCode: "401",
        message: "Unauthorised access. You need to log in or register."
      }
    };
    res.render("error", templateVars);
    return;
  }

  const shortURL = generateRandomString(6, urlDatabase, users);
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

// CREATE/POST: Handle user login and set a cookie with the user_id
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  // Validate login and display error if there is one
  const { error, data } = validateLogin(email, password, users);
  if (error) {
    const templateVars = { error, user: null };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }

  // If everything is valid for login, set cookie and redirect to urls index page for user
  req.session['user_id'] = data.id;
  res.redirect(`/urls`);
});

// CREATE/POST: Handle registration form data
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  
  // Validate login and display error if there is one
  const { error, data } = validateRegister(email, password, users, urlDatabase);
  if (error) {
    const templateVars = { error, user: null };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }
  
  // If everything is valid for registration
  req.session['user_id'] = data.id;
  res.redirect(`/urls`);
});

// CREATE/POST: Handle user logout and clear cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// PUT REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// UPDATE/PUT: Handle the update request from the home page
app.put("/urls/:shortURL", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  // If user is not logged in
  if (!userID) {
    res.status(401);
    const templateVars = {
      user: null,
      error: {
        statusCode: "401",
        message: "Unauthorised access. You need to log in or register."
      }
    };
    res.render("error", templateVars);
    return;
  }

  // If user is logged in, check if shortURL belongs to current user
  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) {
    res.status(403);
    const templateVars = {
      user: users[userID],
      error: {
        statusCode: "403",
        message: "Unauthorised access."
      }
    };
    res.render("error", templateVars);
    return;
  }

  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// DELETE REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// DELETE: Handle the form submission to remove a specific existing shortened URL from database
app.delete("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;

  // If user is not logged in
  if (!userID) {
    res.status(401);
    const templateVars = {
      user: null,
      error: {
        statusCode: "401",
        message: "Unauthorised access. You need to log in or register."
      }
    };
    res.render("error", templateVars);
    return;
  }

  // If user is logged in, check if shortURL belongs to current user
  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) {
    res.status(403);
    const templateVars = {
      user: users[userID],
      error: {
        statusCode: "403",
        message: "Unauthorised access."
      }
    };

    res.render("error", templateVars);
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// SERVER LISTEN --------------------------------------------
/////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});