require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Serve uploaded proof images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Webhook must use raw body BEFORE express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/subscription',require('./routes/subscritpiton.routes'));
app.use('/api/scores',require('./routes/score.routes')); 
app.use('/api/charities',require('./routes/charity.routes'));
app.use('/api/draws',require('./routes/draw.routes'));
app.use('/api/winners',      require('./routes/winner.routes')); 
app.use('/api/admin',        require('./routes/admin.routes')); // add this

module.exports = app