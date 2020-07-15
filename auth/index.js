const express = require('express');
const joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db/connection.js');
const users = db.get('users');
users.createIndex('username', { unique: true });

const router = express.Router();

const schema = joi.object().keys({
    username: joi.string().trim().regex(/(^[a-zA-Z0-9]+$)/).min(2).max(30).required(),
    password: joi.string().trim().min(6).required()
});

function createTokenSendResponse(user, res, next) {
    // they sent us the right password, respond with token
    const payload = {
        _id: user._id,
        username: user.username
    };
    // create a jsonwebtoken that expires in 1h         
    jwt.sign(payload, process.env.TOKEN_SECRET, {
        expiresIn: '1h'
    }, (err, token) => {
        if (err) {
            respondError422(res, next);
        } else {
            res.json({
                token
            });
        }
    });
};

// any route in here is prepended with /auth

router.get('/', (req, res) => {
    res.json({
        message: 'Lock'
    });
});

//POST /auth/signup

// NOTE: when a client posts to the server at /signup, validate 
// against requirements set in the "schema",
// If validated, use findOne to search db for that username to check if it exists
router.post('/signup', (req, res, next) => {
    const result = joi.validate(req.body, schema);
    if (result.error === null) {
        users.findOne({
            username: req.body.username
        }).then(user => {
            // if "user" is undefined, username is not in the db, otherwise it's a duplicate
            if (user) {
                // there is already a user in the db with this username
                // respond with an error
                const error = new Error('Server: Username is taken (╯°□°）╯︵ ┻━┻');
                // forward the variable "error" into the error handler
                res.status(409);
                next(error);
            } else {
                //hash password
                bcrypt.hash(req.body.password, 8).then(hashedPassword => {

                    // create newUser and then insert newUser with hashed password into db
                    const newUser = {
                        username: req.body.username,
                        password: hashedPassword
                    };

                    users.insert(newUser).then(insertedUser => {
                        createTokenSendResponse(insertedUser, res, next);
                    });
                });
            }
        });
    } else {
        res.status(422);
        next(result.error);
    }
});

function respondError422(res, next) {
    res.status(422);
    const error = new Error('Server: Unable to login');
    next(error);
}


// logging in and validating the user
router.post('/login', (req, res, next) => {
    const result = joi.validate(req.body, schema);
    // figure out if user exists in db
    if (result.error === null) {
        users.findOne({
            username: req.body.username,
        }).then(user => {
            // if user is a thing, now compare the password
            // else next the error
            if (user) {
                console.log('Comparing password: ', req.body.password, ' with the hash: ', user.password);

                bcrypt
                    .compare(req.body.password, user.password)
                    .then((result) => {
                        if (result) {
                          createTokenSendResponse(user, res, next);
                        } else {
                            respondError422(res, next);
                        }
                    });
            } else {
                respondError422(res, next);
            }
        });
    } else {
        respondError422(res, next);
    }
});

module.exports = router;