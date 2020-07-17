/* Handles authentication, signups and creates tokens for login sessions.
    Any route in here is prepended in the URL with '/auth'. 
    - eg: 'www.example.com/auth/[any route in here]'
*/

const express = require('express');
const joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create connection to database 'users'
const db = require('../db/connection.js');
const users = db.get('users');

/* Create an index in 'users' called 'username' 
   - and only allow unique inputs on 'username' 
*/
users.createIndex('username', { unique: true });

// Use 'express' to route requests
const router = express.Router();

// Define rules in variable 'schema' using 'joi' for valid inputs of 'username' and 'password'
const schema = joi.object().keys({
    username: joi.string().trim().regex(/(^[a-zA-Z0-9]+$)/).min(2).max(30).required(),
    password: joi.string().trim().min(6).required()
});

/* Create a function to create a token and send it back to the user as a response:
    - The token is later stored in localstorage on a user's browser so that
    - they are able to access their dashboard or information stored in database 
*/
function createTokenSendResponse(user, res, next) {
    // Store user ID and username in var 'payload' to use to sign the token
    const payload = {
        _id: user._id,
        username: user.username
    };
    /* Create a token with 'jwt' that expires in 1h
        - This pulls 'TOKEN_SECRET' from '.env' in 'server' folder
        - The TOKEN_SECRET is a string used to sign the token and make it unique 
    */    
    jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: '1h'
    }, (err, token) => {
        // If error exists, respond with 422 error
        if (err) {
            respondError422(res, next);
          // Else, respond by sending newly created token
        } else {
            res.json({
                token
            });
        }
    });
};

// This is the default return for 'www.example.com/auth/'
router.get('/', (req, res) => {
    res.json({
        message: '🔒'
    });
});

/* NOTE: When a client posts or submits data to the server at 'www.example.com/auth/signup':
    - If inputs are valid, use findOne to search database for that username to check if it exists 
    - If the inputted 'username' doesn't exist, use 'bcrypt' to hash the inputted 'password'
    - Then, insert the new user login info in the 'users' database
    - Then, auto login the new user with 'createTokenSendResponse' 
*/
router.post('/signup', (req, res, next) => {
    // Validate the input 'req.body' against requirements set in var 'schema'
    const result = joi.validate(req.body, schema);
    if (result.error === null) {
        // If validated, use findOne to search 'users' database for 'username' in input 'req.body'
        users.findOne({
            username: req.body.username
        }).then(user => {
            // If 'user' already exists, respond with error
            if (user) {
                const error = new Error('Server: Username is taken (╯°□°）╯︵ ┻━┻');
                // Respond with 409 error, and send error into error handler on server index
                res.status(409);
                next(error);
              // Else, hash the 'password' from input 'req.body', and insert newUser into DB 'users'  
            } else {
                bcrypt.hash(req.body.password, 8).then(hashedPassword => {
                    // Create var 'newUser'
                    const newUser = {
                        username: req.body.username,
                        password: hashedPassword
                    };
                    // Insert the 'newUser' into DB 'users', with hashed password. 
                    users.insert(newUser)
                    // Then create token, and auto login using the users info
                    .then(insertedUser => {
                        createTokenSendResponse(insertedUser, res, next);
                    });
                });
            }
        });
      // If the input wasn't able to be validated, return 422 error and send to error handler  
    } else {
        res.status(422);
        next(result.error);
    }
});

// Create a function to respond with a 422 error and forward the error to error handler
function respondError422(res, next) {
    res.status(422);
    const error = new Error('Server: Unable to login');
    next(error);
}

/* NOTE: When a client posts or submits data to the server at 'www.example.com/auth/login':
    - If inputs are valid, use findOne to search database for that username to check if it exists 
    - Then, if the inputted 'username' exists:
        - Use 'bcrypt' to compare the inputted 'password' with the stored hashed password
    - If password was correct, log in the user with 'createTokenSendResponse' 
*/
router.post('/login', (req, res, next) => {
    // Validate inputs using 'joi' against 'schema'
    const result = joi.validate(req.body, schema);
    // If inputs are valid, find 'username' data in 'users' DB
    if (result.error === null) {
        users.findOne({
            username: req.body.username,
        }).then(user => {
            // If user exists, use 'bcrypt' to compare inputted 'password' with stored hashed password
            if (user) {
                // Say what's happening in server console
                console.log('Comparing password: ', req.body.password, ' with the hash: ', user.password);
                bcrypt.compare(req.body.password, user.password)
                    .then((result) => {
                        // If the password was correct, create a token and login
                        if (result) {
                            createTokenSendResponse(user, res, next);
                          // If the password was wrong, respond with 422 error  
                        } else {
                            respondError422(res, next);
                        }
                    });
              // If user doesn't exist in DB, respond with 422 error      
            } else {
                respondError422(res, next);
            }
        });
      // If the inputs aren't valid using 'joi' against 'schema' rules, respond with 422 error  
    } else {
        respondError422(res, next);
    }
});

module.exports = router;