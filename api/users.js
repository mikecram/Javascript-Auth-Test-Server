// Handles users

const express = require('express');
const db = require('../db/connection.js')
const joi = require('joi');
const bcrypt = require('bcryptjs');

const users = db.get('users');
const router = express.Router();


const schema = joi.object().keys({
    username: joi.string()
        .trim()
        .regex(/(^[a-zA-Z0-9]+$)/)
        .min(2)
        .max(30),
    password: joi.string()
        .trim()
        .min(6),
    roles: joi.string()
        .valid('user', 'admin'),
    active: joi.boolean()

});

// Get all users
router.get('/', async (req, res, next) => {
    // Try to find all data stored in 'users' database,
    try {
        // Store all data in 'result', without password
        const result = await users.find({}, '-password');
        // Respond with 'result', or list all user data
        res.json(result);
      // If it can't find data in 'users' database, catch it and send to error handler
    } catch (error) {
        next(error);
    }
});


// CREATE NEW USER using this:
// edit user info in database
router.patch('/:id', async (req, res, next) => {
    const { id: _id } = req.params;
    // find user in Db with given id
    try {
        // try to validate req body
        const result = schema.validate(req.body);
        // if valid, find user by id in database
        if(!result.error) { 
            const query = { _id }
            const user = await users.findOne(query);
            // if user exists
            if (user) {
                // update user in database
                const updatedUser = req.body;
                if (updatedUser.password) {
                    updatedUser.password = await bcrypt.hash(updatedUser.password, 8);
                }
                const result = await users.findOneAndUpdate(query, {
                    $set: updatedUser,
                });
                delete result.password;
                res.json(result);
            } else {
                // if not exists - send 404 user not found
                next();
            }
        } else {
            // if not valid, send error with reason    
            res.status(422);
            throw new Error(result.error);
        }
    } catch (error) {
        next(error);
    }

});


module.exports = router;