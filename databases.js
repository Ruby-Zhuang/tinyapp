/////////////////////////////////////////////////////////////
// CONSTANTS, MODULES & DEPENDENCIES ------------------------
/////////////////////////////////////////////////////////////
const bcrypt = require('bcrypt');
const saltRounds = 10;

/////////////////////////////////////////////////////////////
// DATABASES ------------------------------------------------
/////////////////////////////////////////////////////////////
// Databases for testing purposes
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

module.exports = { users, urlDatabase };
