/* This is the server index. 
  - It handles all requests and routing.
  - It determines all responses by executing from the top down.
  - It contains an error handler so that any error responses can be routed to one place. 
*/

// Assign packages to variables to make things a lot easier
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Assign all backend routes to variables to be used here easier 
const middlewares = require('./auth/middlewares.js');
const auth = require('./auth/index.js');
const notes = require('./api/notes.js');
const users = require('./api/users.js');
const expenses = require('./api/expenses.js');

// Morgan is a HTTP request logger middleware; it logs helpful things in the console
app.use(morgan('dev'));
// CORS allows you to set access allowances to the server or routes within it. 
// More Info: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
app.use(cors({
    origin: 'http://localhost:8080'
}));
// This makes the server able to parse the body of a JSON response
app.use(express.json());
// This uses custom middleware to check for a token of a logged in user
app.use(middlewares.checkTokenSetUser);

// This is a default response for the main index of the server (eg:'https://www.example.com/')
app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨Hello World! 🌈✨🦄',
    user: req.user,
  });
});
// A request for 'https://www.example.com/auth' responds with the 'auth' index
app.use('/auth', auth);
/* A request for 'https://www.example.com/api/v1/notes' responds by:
 - using the 'isLoggedIn' function in 'middlewares' to check if logged in before responding with 'notes' */
app.use('/api/v1/notes', middlewares.isLoggedIn, notes);
/* A request for 'https://www.example.com/api/v1/users' responds with 'users': */
app.use('/api/v1/users', middlewares.isLoggedIn, middlewares.isAdmin, users);
//
app.use('/api/v1/expenses', middlewares.isLoggedIn, expenses);



// Creates a function that can be used throughout the server to forward a 404 error to the error handler
function notFound(req, res, next) {
  res.status(404);
  const error = new Error('Not Found - ' + req.originalUrl);
  next(error);
}

/* Creates an error handler that is usable throughout the server:
  - It responds with a default 500 serverside error code in a JSON object to be returned for use in the front-end
*/
function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack
  });
}

// If the request comes through and doesn't land on a page within the server stack above
app.use(notFound);
app.use(errorHandler);

/* Set the PORT for server within '.env' file, or set default PORT 5000
  - Listen on PORT for incoming http requests,
  - Display in console for debugging purposes 
*/
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log('Listening on port', port);
});