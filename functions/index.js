const functions = require('firebase-functions');
const express = require('express');

const FBAuth = require('./middleware/fbAuth');
const { getAllScreams, postOneScream } = require('./handlers/screams');
const { signup, login } = require('./handlers/users');

// Initialize express app
const app = express();

// Scream routes
app.get('/screams', FBAuth, getAllScreams);
app.post('/screams', FBAuth, postOneScream);

// User routes
app.post('/signup', signup);
app.post('/login', login);

exports.api = functions.https.onRequest(app);
