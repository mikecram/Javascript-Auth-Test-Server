const express = require('express');

const router = express.Router();

// get notes and return array
router.get('/', (req, res) => {
    res.json([]);
})

module.exports = router;