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
const getUserByEmail = (email, database) => {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }

  return null;
};

// Returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id, database) => {
  const userURLs = {};

  for (const shortURL in database) {
    const { userID, longURL} = database[shortURL];
    if (userID === id) {
      userURLs[shortURL] = longURL;
    }
  }

  return userURLs;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};