// Handles users

const express = require('express');
const db = require('../db/connection.js')
const users = db.get('users');

const router = express.Router();

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


module.exports = router;