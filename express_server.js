/* eslint-disable camelcase */
/////////////////////////////////////////////////////////////
// CONSTANTS, SETUP & DEPENDENCIES --------------------------
/////////////////////////////////////////////////////////////
const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const saltRounds = 10;
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

/////////////////////////////////////////////////////////////
// DATABASES -------------------------------------------------
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
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  sgq3y6: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  }
};

/////////////////////////////////////////////////////////////
// HELPER FUNCTIONS -----------------------------------------
/////////////////////////////////////////////////////////////

// Generates a new "unique" shortURL [0-9 a-z A-Z]
const generateRandomString = (numCharacters) => {
  //const randomString = Math.random().toString(36).substring(2, numCharacters + 2);
  const stringList = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomString = '';
  for (let i = 1; i <= numCharacters; i++) {
    let randomCharIndex = Math.floor(Math.random() * stringList.length);
    let randomChar = stringList[randomCharIndex];
    randomString += randomChar;
  }

  // // Recursive case if randomString already exists as a shortURL in the database
  // if (urlDatabase[randomString]) {
  //   generateRandomString(numCharacters);
  // }

  return randomString;
};

// Get user by email
const getUserByEmail = (email) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

// Returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id) => {
  const userURLs = {};

  for (const shortURL in urlDatabase) {
    const { userID, longURL} = urlDatabase[shortURL];
    if (userID === id) {
      userURLs[shortURL] = longURL;
    }
  }

  return userURLs;
};

// Possible helper functions to improve readiblility
// createNewUser/validateRegister (email, password) => (error, data)
// validateLogin (email, password) => (error, data)
// Refactor checkEmail exists
// If have time, test for http and https prefixes


/////////////////////////////////////////////////////////////
// GET REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// READ: Redirect to display all the URLs if user goes to root
app.get("/", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id) {
    res.redirect(`/urls`);
  } else {
    res.redirect(`/login`);
  }
});

// READ: Display all the URLs and their shortened forms
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const userURLs = urlsForUser(user_id);
  const templateVars = {
    user: users[user_id],
    urls: userURLs
  };

  if (!user_id) {
    res.redirect(`/login`);
    return;
  }

  res.render("urls_index", templateVars);
  //console.log(templateVars);
});

// READ: Display basic form page that allows user to submit URLs to be shortened
// Needs to be before /urls/:shortURL endpoint otherwise Express will think new is a route parameter
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;

  if (!user_id) {
    res.redirect(`/login`);
    return;
  }

  const templateVars = {
    user: users[user_id],
  };
  res.render("urls_new", templateVars);
});

// READ: Display a single URL and its shortened form along with a form to update a specific existing shortened URL in database
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = {
    user: users[user_id],
    shortURL,
    longURL
  };
  res.render("urls_show", templateVars);
});

// READ: Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// READ: Display registration form
app.get("/register", (req, res) => {
  const user_id = req.session.user_id; // NEED TO CHECK IF USER IS LOGGED IN ALREADY

  if (user_id) {
    res.redirect(`/urls`);
    return;
  }

  const templateVars = {
    user: null
  };
  res.render("register", templateVars);
});

// READ: Display login form
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;

  if (user_id) {
    res.redirect(`/urls`);
    return;
  }

  const templateVars = {
    user: null
  };
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
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  const user_id = req.session.user_id;
  
  urlDatabase[shortURL] = { longURL, userID: user_id};
  res.redirect(`/urls/${shortURL}`);
});

// CREATE/POST: Handle user login and set a cookie with the user_id
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Authenticate: error if either email or password fields are empty
  if (email === '' || password === '') {
    res.status(400);
    const templateVars = {
      user: null,
      statusCode: "400",
      message: "Invalid email and/or password."
    };
    res.render("error", templateVars);
    return;
  }

  // Authenticate: error if email doesn't exist (meaning a user with the email isn't found)
  const user = getUserByEmail(email);
  if (!user) {
    res.status(403);
    const templateVars = {
      user: null,
      statusCode: "403",
      message: "Your email is currently not registered with us."
    };
    res.render("error", templateVars);
    return;
  }

  // Authenticate: error if email exists, but passwords don't match
  const hashedPassword = user.password;
  if (!bcrypt.compareSync(password, hashedPassword)) {
    res.status(403);
    const templateVars = {
      user: null,
      statusCode: "403",
      message: "Incorrect email and/or password."
    };
    res.render("error", templateVars);
    return;
  }

  // If everything is valid for login
  req.session.user_id = user.id;
  res.redirect(`/urls`);
});

// CREATE/POST: Handle registration form data
app.post("/register", (req, res) => {
  const newUserID = generateRandomString(6);
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  // Authenticate: error if either email or password fields are empty
  if (email === '' || password === '') {
    //res.status(400).send("Error message here");
    res.status(400);
    const templateVars = {
      user: null,
      statusCode: "400",
      message: "Invalid email and/or password."
    };
    res.render("error", templateVars);
    return;
  }

  // Authenticate: error if email already exist (meaning a user was found in the database for that email entered)
  const user = getUserByEmail(email);
  if (user) {
    res.status(400);
    const templateVars = {
      user: null,
      statusCode: "400",
      message: "This email address is already being used."
    };
    res.render("error", templateVars);
    return;
  }

  // If everything is valid for registration
  users[newUserID] = {
    id: newUserID,
    email,
    password: hashedPassword
  };

  req.session.user_id = newUserID;
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
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  if (user_id) {
    urlDatabase[shortURL].longURL = longURL;
  }

  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// DELETE REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// DELETE: Handle the form submission to remove a specific existing shortened URL from database
app.delete("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (user_id) {
    delete urlDatabase[shortURL];
  }

  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// SERVER FUNCTION ------------------------------------------
/////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});