// Handles expenses

const express = require('express');
const joi = require('joi');

// Create connection to database 'notes'
const db = require('../db/connection.js');
const expenses = db.get('expenses');

// Define rules in variable 'schema' using 'joi' for valid inputs of 'title' and 'note'
const schema = joi.object().keys({
    category: joi.string().trim().max(100).required(),
    amount: joi.number().required(),
    date: joi.date().required(),
    note: joi.string().trim().max(200),
    person: joi.string().trim(),
    account: joi.string().trim()
});

// Use 'express' to route requests
const router = express.Router();

// Get notes from 'notes' database
router.get('/', (req, res) => {
    // Find notes that match current user._id
    expenses.find({
        user_id: req.user._id
        // Respond with json of all stored notes that match current user._id
    }).then(expenses => {
        res.json(expenses);
    });
});

// Add new expense
router.post('/', (req, res, next) => {
    // Validate that inputs using rules outlined in var 'schema'
    const result = joi.validate(req.body, schema);
    // If valid inputs, store body of inputs and user ID in 'note'
    if (result.error === null) {
        const expense = {
            ...req.body,
            user_id: req.user._id
        };
        // Insert 'note' into 'notes' db, then respond with contents of 'note'
        expenses.insert(expense).then(expense => {
            res.json(expense);
        });
      // If not valid inputs, forward error to error handler and return error 422  
    } else {
        const error = new Error(result.error);
        res.status(422);
        next(error);
    }
});



module.exports = router;