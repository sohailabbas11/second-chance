const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const bcryptjs = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; 

router.post('/register', async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;

        // Validate required fields
        if (!email || !firstName || !lastName || !password) {
            logger.error('Missing required fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        const db = await connectToDatabase();
        const collection = db.collection("users");

        // Check if email already exists
        const existingEmail = await collection.findOne({ email });
        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(password, salt);

        // Insert new user
        const newUser = await collection.insertOne({
            email,
            firstName,
            lastName,
            password: hash,
            createdAt: new Date(),
        });

        // Generate JWT token
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        logger.info('User registered successfully');
        res.json({ authtoken, email });
    } catch (e) {
        logger.error(`Error registering user: ${e.message}`);
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            logger.error('Email or password missing');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const db = await connectToDatabase();
        const collection = db.collection("users");

        // Find user by email
        const theUser = await collection.findOne({ email });
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare password
        const isPasswordCorrect = await bcryptjs.compare(password, theUser.password);
        if (!isPasswordCorrect) {
            logger.error('Passwords do not match');
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: theUser._id.toString(),
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        // Prepare response
        const userName = theUser.firstName;
        const userEmail = theUser.email;

        logger.info('User logged in successfully');
        return res.json({ authtoken, userName, userEmail });
    } catch (error) {
        logger.error(`Error during login: ${error.message}`);
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;
