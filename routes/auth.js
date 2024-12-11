const express = require('express');
const router = express.Router();

// Example route
router.post('/register', (req, res) => {
    res.status(200).json({ message: 'Register route working!' });
});

router.post('/login', (req, res) => {
    res.status(200).json({ message: 'Login route working!' });
});

module.exports = router;