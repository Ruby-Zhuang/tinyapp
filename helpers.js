/////////////////////////////////////////////////////////////
// CONSTANTS, MODULES & DEPENDENCIES ------------------------
/////////////////////////////////////////////////////////////
const bcrypt = require('bcrypt');
const saltRounds = 10;

/////////////////////////////////////////////////////////////
// HELPER FUNCTIONS -----------------------------------------
/////////////////////////////////////////////////////////////

// CREATE A NEW USER
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

// GENERATES A NEW "UNIQUE" ID [a-z A-Z 0-9]
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
    return generateRandomString(numCharacters);
  }

  return randomString;
};

// GET USER OJBECT BY EMAIL
const getUserByEmail = (email, userDatabase) => {
  for (const userID in userDatabase) {
    if (userDatabase[userID].email === email) {
      return userDatabase[userID];
    }
  }

  return;
};

// GET URLS WHERE THE USERID IS EQUAL TO THE ID OF THE CURRENTLY LOGGED-IN USER
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

// VALIDATE ACCESS OF USER BASED ON CONDITIONS SET IN PERFORMCHECKS OBJECT AND RETURNS ERROR IF ANY
const validateAccess = (performChecks, userID, shortURL, urlDatabase) => {

  // If specified, check if shortURL is valid
  if (performChecks.validURL) {
    if (!urlDatabase[shortURL]) {
      const error = { statusCode: 404, message: "ShortURL not found." };
      return error;
    }
  }

  // If specified, check if user is logged in
  if (performChecks.loggedIn) {
    if (!userID) {
      const error = { statusCode: 401, message: "Unauthorized access. You need to log in or register." };
      return error;
    }
  }

  // If specified, check if shortURL belongs to current user
  if (performChecks.urlOwner) {
    const userURLs = urlsForUser(userID, urlDatabase);
    if (!userURLs[shortURL]) {
      const error = { statusCode: 403, message: "Unauthorized access." };
      return error;
    }
  }

  return null;
};

// VALIDATE THE LOGIN OF A USER
const validateLogin = (email, password, usersDatabase) => {
  // Error if either email and/or password fields are empty
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

  // If everything is valid for login, return user data
  return { error: null, data: user };
};

// VALIDATE THE LOGIN OF A USER
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

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
  validateAccess,
  validateLogin,
  validateRegister,
};
