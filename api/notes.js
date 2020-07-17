// Handles notes

const express = require('express');
const joi = require('joi');

// Create connection to database 'notes'
const db = require('../db/connection.js');
const notes = db.get('notes');

// Define rules in variable 'schema' using 'joi' for valid inputs of 'title' and 'note'
const schema = joi.object().keys({
    title: joi.string().trim().max(100).required(),
    note: joi.string().trim().required()
});

// Use 'express' to route requests
const router = express.Router();

// Get notes from 'notes' database
router.get('/', (req, res) => {
    // Find notes that match current user._id
    notes.find({
        user_id: req.user._id
        // Respond with json of all stored notes that match current user._id
    }).then(notes => {
        res.json(notes);
    });
});

// Add new note
router.post('/', (req, res, next) => {
    // Validate that inputs using rules outlined in var 'schema'
    const result = joi.validate(req.body, schema);
    // If valid inputs, store body of inputs and user ID in 'note'
    if (result.error === null) {
        const note = {
            ...req.body,
            user_id: req.user._id
        };
        // Insert 'note' into 'notes' db, then respond with contents of 'note'
        notes.insert(note).then(note => {
            res.json(note);
        });
      // If not valid inputs, forward error to error handler and return error 422  
    } else {
        const error = new Error(result.error);
        res.status(422);
        next(error);
    }
});



module.exports = router;