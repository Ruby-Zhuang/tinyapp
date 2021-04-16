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
const { generateRandomString, urlsForUser, validateAccess, validateLogin, validateRegister } = require('./helpers');

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
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
  },
  b2xVn2: {
    longURL: "http://www.netflix.com",
    userID: "aJ48lW"
  },
  sgq3y6: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  }
};

/////////////////////////////////////////////////////////////
// GET REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// READ: REDIRECT TO DISPLAY ALL THE URLS IF USER GOES TO ROOT
app.get("/", (req, res) => {
  const userID = req.session['user_id'];
  if (userID) {
    res.redirect(`/urls`);
  } else {
    res.redirect(`/login`);
  }
});

// READ: DISPLAY ALL THE URLS AND THEIR SHORTENED FORMS
app.get("/urls", (req, res) => {
  const userID = req.session['user_id'];

  // Validate access for whether a user is logged in
  const performChecks = { loggedIn: true };
  const error = validateAccess(performChecks, userID, null, urlDatabase);
  if (error) {
    const templateVars = { error, user: users[userID] };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }

  // Show user's urls if they are logged in
  const userURLs = urlsForUser(userID, urlDatabase);
  const templateVars = { user: users[userID], urls: userURLs};
  res.render("urls_index", templateVars);
});

// READ: DISPLAY FORM PAGE THAT ALLOWS USER TO SUBMIT URLS TO BE SHORTENED
// Needs to be before /urls/:shortURL endpoint otherwise Express will think new is a route parameter
app.get("/urls/new", (req, res) => {
  const userID = req.session['user_id'];
  
  // Redirect to login page if user is not logged in
  if (!userID) {
    res.redirect(`/login`);
    return;
  }

  const templateVars = { user: users[userID]};
  res.render("urls_new", templateVars);
});

// READ: DISPLAY A SINGLE URL AND ITS SHORTENED FORM ALONG WITH A FORM TO UPDATE A SPECIFIC EXISTING SHORTENED URL IN DATABASE
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;

  // Validate access for whether shortURL is valid, if a user is logged in and if user owns the shortURL
  const performChecks = { validURL: true, loggedIn: true, urlOwner: true };
  const error = validateAccess(performChecks, userID, shortURL, urlDatabase);
  if (error) {
    const templateVars = { error, user: users[userID] };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }
  
  // Render specific URL page if user has access
  const longURL = urlDatabase[shortURL].longURL;
  const user = users[userID];
  const templateVars = { user, shortURL, longURL };
  res.render("urls_show", templateVars);
});

// READ: REDIRECT ANY REQUEST TO "/U/:SHORTURL" TO ITS LONGURL
app.get("/u/:shortURL", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;

  // Validate access for whether shortURL is valid
  const performChecks = { validURL: true };
  const error = validateAccess(performChecks, userID, shortURL, urlDatabase);
  if (error) {
    const templateVars = { error, user: users[userID] };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }

  // If shortURL is valid, redirect to longURL site
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// READ: DISPLAY REGISTRATION FORM
app.get("/register", (req, res) => {
  const userID = req.session['user_id'];

  // Redirect user to urls index if they're already logged in
  if (userID) {
    res.redirect(`/urls`);
    return;
  }

  const templateVars = { user: null };
  res.render("register", templateVars);
});

// READ: DISPLAY LOGIN FORM
app.get("/login", (req, res) => {
  const userID = req.session['user_id'];

  // Redirect user to urls index if they're already logged in
  if (userID) {
    res.redirect(`/urls`);
    return;
  }

  const templateVars = { user: null };
  res.render("login", templateVars);
});

/////////////////////////////////////////////////////////////
// POST REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// CREATE/POST: HANDLE THE FORM SUBMISSION TO ADD LONGURL TO THE DATABASE WITH AN ASSOCIATED RANDOM SHORTURL AND THE CURRENT USER
app.post("/urls", (req, res) => {
  const userID = req.session['user_id'];

  // Validate access for whether a user is logged in
  const performChecks = { loggedIn: true };
  const error = validateAccess(performChecks, userID, null, urlDatabase);
  if (error) {
    const templateVars = { error, user: users[userID] };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }

  // Add new URL to database if user is logged in
  const shortURL = generateRandomString(6, urlDatabase, users);
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

// CREATE/POST: HANDLE USER LOGIN AND SET A COOKIE WITH THE USER_ID
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

// CREATE/POST: HANDLE REGISTRATION FORM DATA
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

// UPDATE/PUT: HANDLE THE UPDATE REQUEST FROM THE SHORTURL PAGE
app.put("/urls/:shortURL", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  // Validate access for whether a user is logged in and if user owns the shortURL
  const performChecks = { loggedIn: true, urlOwner: true };
  const error = validateAccess(performChecks, userID, shortURL, urlDatabase);
  if (error) {
    const templateVars = { error, user: users[userID] };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }

  // Update longURL if shortURL belongs to user
  urlDatabase[shortURL].longURL = longURL;
  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// DELETE REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// DELETE: HANDLE THE FORM SUBMISSION TO REMOVE A SPECIFIC EXISTING SHORTENED URL FROM DATABASE
app.delete("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session['user_id'];
  const shortURL = req.params.shortURL;

  // Validate access for whether a user is logged in and if user owns the shortURL
  const performChecks = { loggedIn: true, urlOwner: true };
  const error = validateAccess(performChecks, userID, shortURL, urlDatabase);
  if (error) {
    const templateVars = { error, user: users[userID] };
    res.status(error.statusCode);
    res.render("error", templateVars);
    return;
  }
  
  // Delete shortURL data if user has access/is owner
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

/////////////////////////////////////////////////////////////
// SERVER FUNCTION ------------------------------------------
/////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
