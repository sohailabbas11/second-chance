require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Health check endpoint for Kubernetes probes
app.get('/health', (req, res) => {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
        res.status(200).json({ status: 'healthy', database: 'connected' });
    } else {
        res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// MongoDB Connection String Construction
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';
const MONGO_PORT = process.env.MONGO_PORT || '27017';
const MONGO_DB = process.env.MONGO_DB || 'secondchance';
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

const mongoUrl = MONGO_USER && MONGO_PASSWORD
    ? `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`
    : `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;

// MongoDB Connection with retry logic
const connectWithRetry = () => {
    console.log('Attempting to connect to MongoDB...');
    mongoose.connect(mongoUrl)
        .then(() => {
            console.log('Successfully connected to MongoDB');
        })
        .catch(err => {
            console.error('MongoDB connection error:', err);
            console.log('Retrying connection in 5 seconds...');
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected! Attempting to reconnect...');
    connectWithRetry();
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Item Schema
const itemSchema = new mongoose.Schema({
name: { type: String, required: true },
description: String,
price: { type: Number, required: true },
condition: String,
category: String,
createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

app.get('/', function (req, res) {
console.log('Received request for /');
res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/app', function (req, res) {
console.log('Received request for /app');
res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// API Routes
app.get('/api/items', async (req, res) => {
try {
    const items = await Item.find();
    res.json(items);
} catch (error) {
    res.status(500).json({ message: error.message });
}
});

app.post('/api/items', async (req, res) => {
try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
} catch (error) {
    res.status(400).json({ message: error.message });
}
});

app.get('/api/items/:id', async (req, res) => {
try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
} catch (error) {
    res.status(500).json({ message: error.message });
}
});

app.put('/api/items/:id', async (req, res) => {
try {
    const updatedItem = await Item.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.json(updatedItem);
} catch (error) {
    res.status(400).json({ message: error.message });
}
});

app.delete('/api/items/:id', async (req, res) => {
try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
} catch (error) {
    res.status(500).json({ message: error.message });
}
});

// Error handling middleware
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 9000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Starting graceful shutdown...');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received. Starting graceful shutdown...');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
});
