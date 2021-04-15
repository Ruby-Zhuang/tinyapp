/////////////////////////////////////////////////////////////
// CONSTANTS, MODULES & DEPENDENCIES ------------------------
/////////////////////////////////////////////////////////////
const bcrypt = require('bcrypt');
const saltRounds = 10;

/////////////////////////////////////////////////////////////
// HELPER FUNCTIONS -----------------------------------------
/////////////////////////////////////////////////////////////

// Create a new user
const createNewUser = (email, password, usersDatabase, urlDatabase) => {
  const newUserID = generateRandomString(6, urlDatabase, usersDatabase);
  const hashedPassword = bcrypt.hashSync(password, saltRounds);

  usersDatabase[newUserID] = {
    id: newUserID,
    email,
    password: hashedPassword
  };
  
  const newUser = usersDatabase[newUserID];
  return newUser;
};

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
  // Error if either email or password fields are empty
  if (email === '' || password === '') {
    const error = { statusCode: 400, message: "Invalid email and/or password." };
    return { error, data: null };
  }

  // Error if email doesn't exist (meaning a user with the email isn't found)
  const user = getUserByEmail(email, usersDatabase);
  if (!user) {
    const error = { statusCode: 403, message: "Your email is currently not registered with us." };
    return { error, data: null };
  }

  // Error if email exists, but passwords don't match
  const hashedPassword = user.password;
  const passwordsMatch = bcrypt.compareSync(password, hashedPassword);
  if (!passwordsMatch) {
    const error = { statusCode: 403, message: "Incorrect email and/or password." };
    return { error, data: null };
  }

  // If everything is valid for login, return user
  return { error: null, data: user };
};

// Validate the login of a user
const validateRegister = (email, password, usersDatabase, urlDatabase) => {
  // Error if either email or password fields are empty
  if (email === '' || password === '') {
    const error = { statusCode: 400, message: "Invalid email and/or password." };
    return { error, data: null };
  }

  // Error if email doesn't exist (meaning a user with the email isn't found)
  const userExists = getUserByEmail(email, usersDatabase);
  if (userExists) {
    const error = { statusCode: 400, message: "This email address is already being used." };
    return { error, data: null };
  }

  // If everything is valid for registering, create new user and return user
  const newUser = createNewUser(email, password, usersDatabase, urlDatabase);
  return { error: null, data: newUser };
};

const validateResource = (shortURL, urlDatabase) => {
  if (!urlDatabase[shortURL]) {
    const error = { statusCode: 404, message: "ShortURL not found." };
    return error;
  }
  return null;
};

module.exports = {
  generateRandomString,
  urlsForUser,
  validateLogin,
  validateRegister,
  validateResource
};