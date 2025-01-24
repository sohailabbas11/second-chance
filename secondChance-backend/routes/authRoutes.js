const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const bcryptjs = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; 
const { body, validationResult } = require('express-validator');

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

// router.put('/update', async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         logger.error('Validation errors in update request', errors.array());
//         return res.status(400).json({ errors: errors.array() });
//     }
//     try {
//         const email = req.headers.email;
//         if (!email) {
//             logger.error('Email not found in the request headers');
//             return res.status(400).json({ error: "Email not found in the request headers" });
//         }
//         const db = await connectToDatabase();
//         const collection = db.collection("users");
//         const existingUser = await collection.findOne({ email });
//         if (!existingUser) {
//             logger.error('User not found');
//             return res.status(404).json({ error: "User not found" });
//         }
//         existingUser.firstName = req.body.name;
//         existingUser.updatedAt = new Date();
//         const updatedUser = await collection.findOneAndUpdate(
//             { email },
//             { $set: existingUser },
//             { returnDocument: 'after' }
//         );
//         const payload = {
//             user: {
//                 id: updatedUser._id.toString(),
//             },
//         };
//         const authtoken = jwt.sign(payload, JWT_SECRET);
//         logger.info('User updated successfully');
//         res.json({ authtoken });
//     } catch (error) {
//         logger.error(error);
//         return res.status(500).send("Internal Server Error");
//     }
// });

router.put('/update', async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Validation errors in update request', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const email = req.headers.email;
        if (!email) {
            logger.error('Email not found in the request headers');
            return res.status(400).json({ error: "Email not found in the request headers" });
        }

        logger.info(`Updating user with email: ${email}`);
        const db = await connectToDatabase();
        const collection = db.collection("users");

        const existingUser = await collection.findOne({ email });
        if (!existingUser) {
            logger.error('User not found');
            return res.status(404).json({ error: "User not found" });
        }

        existingUser.firstName = req.body.firstName;
        existingUser.updatedAt = new Date();

        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            logger.error('Failed to update the user');
            return res.status(500).json({ error: "Failed to update the user" });
        }

        const payload = {
            user: {
                id: updatedUser._id.toString(),
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        logger.info('User updated successfully');
        res.json({ authtoken });
    } catch (error) {
        logger.error(`Error in update route: ${error.message}`);
        return res.status(500).send("Internal Server Error");
    }
});



module.exports = router;
