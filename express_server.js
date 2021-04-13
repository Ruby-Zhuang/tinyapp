/* eslint-disable camelcase */
/////////////////////////////////////////////////////////////
// CONSTANTS, SETUP & DEPENDENCIES --------------------------
/////////////////////////////////////////////////////////////
const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/////////////////////////////////////////////////////////////
// DATABASES -------------------------------------------------
/////////////////////////////////////////////////////////////
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// Possible helper functions to improve readiblility
// addNewURL
// updateURL

/////////////////////////////////////////////////////////////
// GET REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// READ: Redirect to display all the URLs if user goes to root
app.get("/", (req, res) => {
  res.redirect(`/urls`);
});

// READ: Display all the URLs and their shortened forms
app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: users[user_id],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// READ: Display basic form page that allows user to submit URLs to be shortened
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: users[user_id],
  };
  res.render("urls_new", templateVars);
});

// READ: Display a single URL and its shortened form along with a form to update a specific existing shortened URL in database
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies.user_id;
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[req.params.shortURL];
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
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

// READ: Display registration form
app.get("/register", (req, res) => {
  const user_id = req.cookies.user_id;
  res.cookie('user_id', user_id);
  const templateVars = {
    user: users[user_id],
  };
  res.render("register", templateVars);
});

// READ: For development purposes - JSON string representing the entire urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/////////////////////////////////////////////////////////////
// POST REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// CREATE/POST: Handle the form submission to add the long URL to the database with an associated random short URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

// UPDATE/PUT: Handle the update request from the home page
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls`);
});

// CREATE/POST: Handle user login and set a cookie with the user_id
app.post("/login", (req, res) => {
  const user_id = req.body.user_id;
  res.cookie('user_id', user_id);
  res.redirect(`/urls`);
});

// CREATE/POST: Handle registration form data
app.post("/register", (req, res) => {
  const newUserID = generateRandomString(6);
  const email = req.body.email;
  const password = req.body.password;
  users[newUserID] = {
    id: newUserID,
    email,
    password
  };
  console.log(users);
  res.cookie('user_id', newUserID);
  res.redirect(`/urls`);
});

// CREATE/POST: Handle user logout and clear cookies
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

// DELETE/DELETE: Handle the form submission to remove a specific existing shortened URL from database
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// SERVER FUNCTION ------------------------------------------
/////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
