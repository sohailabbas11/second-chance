require('dotenv').config();
const express = require('express');
const axios = require('axios');
const logger = require('./logger');
const expressPino = require('express-pino-logger')({ logger });
// Task 1: import the natural library
const natural = require("natural")

// Task 2: initialize the express server
const app = express()
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(expressPino);

// Task 3: create the POST /sentiment analysis

app.post('/sentiment', async (req, res) => {
    const { sentence } = req.query;
    if (!sentence) {
        logger.error('No sentence provided');
        return res.status(400).json({ error: 'No sentence provided' });
    }
    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const analyzer = new Analyzer("English", stemmer, "afinn");
    try {
        const analysisResult = analyzer.getSentiment(sentence.split(' ')); 
        let sentiment;
                if (analysisResult < 0) {
            sentiment = "negative";
        } else if (analysisResult < 0.33) {
            sentiment = "neutral";
        } else {
            sentiment = "positive";
        }
        
        logger.info(`Sentiment analysis result: ${analysisResult}`);
        res.status(200).json({ sentimentScore: analysisResult, sentiment: sentiment });
    } catch (error) {
        logger.error(`Error performing sentiment analysis: ${error}`);
        res.status(500).json({ message: "internal error" });
    }
});


app.listen(port, () => {
    logger.info(`Server running on port ${port}`);
});
