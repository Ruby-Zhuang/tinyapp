/////////////////////////////////////////////////////////////
// CONSTANTS, MODULES & DEPENDENCIES ------------------------
/////////////////////////////////////////////////////////////
const bcrypt = require('bcrypt');
const saltRounds = 10;

/////////////////////////////////////////////////////////////
// HELPER FUNCTIONS -----------------------------------------
/////////////////////////////////////////////////////////////

// Generates a new "unique" shortURL [a-z A-Z 0-9]
const generateRandomString = (numCharacters, urlDatabase, usersDatabase) => {
  const validCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 1; i <= numCharacters; i++) {
    let randomCharIndex = Math.floor(Math.random() * validCharacters.length);
    let randomChar = validCharacters[randomCharIndex];
    randomString += randomChar;
  }

  // Recursive case if randomString already exists as a shortURL or userID
  if (urlDatabase[randomString] || usersDatabase[randomString]) {
    generateRandomString(numCharacters);
  }

  return randomString;
};

// Get user by email
const getUserByEmail = (email, userDatabase) => {
  for (const userID in userDatabase) {
    if (userDatabase[userID].email === email) {
      return userDatabase[userID];
    }
  }

  return null;
};

// Returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id, urlDatabase) => {
  const userURLs = {};

  for (const shortURL in urlDatabase) {
    const { userID, longURL} = urlDatabase[shortURL];
    if (userID === id) {
      userURLs[shortURL] = longURL;
    }
  }

  return userURLs;
};

// Validate the login of a user
const validateLogin = (email, password, usersDatabase) => {
  // Authenticate: error if either email or password fields are empty
  if (email === '' || password === '') {
    const error = { statusCode: 400, message: "Invalid email and/or password."};
    return { error, data: null };
  }

  // Authenticate: error if email doesn't exist (meaning a user with the email isn't found)
  const user = getUserByEmail(email, usersDatabase);
  if (!user) {
    const error = { statusCode: 403, message: "Your email is currently not registered with us."};
    return { error, data: null };
  }

  // Authenticate: error if email exists, but passwords don't match
  const hashedPassword = user.password;
  const passwordsMatch = bcrypt.compareSync(password, hashedPassword);
  if (!passwordsMatch) {
    const error = { statusCode: 403, message: "Incorrect email and/or password."};
    return { error, data: null };
  }

  // If everything is valid for login, return user
  return { error: null, data: user };
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  validateLogin
};