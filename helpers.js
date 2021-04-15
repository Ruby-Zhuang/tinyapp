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

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};