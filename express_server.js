/////////////////////////////////////////////////////////////
// CONSTANTS, SETUP & DEPENDENCIES --------------------------
/////////////////////////////////////////////////////////////
const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

/////////////////////////////////////////////////////////////
// DATABASE -------------------------------------------------
/////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/////////////////////////////////////////////////////////////
// HELPER FUNCTIONS -----------------------------------------
/////////////////////////////////////////////////////////////

// Generates a new "unique" shortURL [0-9 a-z A-Z]
const generateRandomString = (numCharacters) => {
  const randomString = Math.random().toString(36).substring(2, numCharacters + 2);
  return randomString;
};

/////////////////////////////////////////////////////////////
// GET REQUESTS ---------------------------------------------
/////////////////////////////////////////////////////////////

// Home route
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Display basic form page that allows user to submit URLs to be shortened
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Display a single URL and its shortened form
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// Display all the URLs and their shortened forms
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Redirect any request to "/u/:shortURL" to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

/////////////////////////////////////////////////////////////
// POST REQUESTS --------------------------------------------
/////////////////////////////////////////////////////////////

// Handle the form submission to remove existing shortened URLs from database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

// Handle the form submission to update existing shortened URLs in database
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Handle the form submission to add the long URL to the database with an associated random short URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  // const templateVars = { shortURL, longURL: urlDatabase[shortURL] };
  // res.render("urls_show", templateVars);
  res.redirect(`/urls/${shortURL}`);
});

/////////////////////////////////////////////////////////////
// SERVER FUNCTION ------------------------------------------
/////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
