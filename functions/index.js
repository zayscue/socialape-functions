const functions = require('firebase-functions');
const express = require('express');

const FBAuth = require('./middleware/fbAuth');
const { getAllScreams, postOneScream } = require('./handlers/screams');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require('./handlers/users');

// Initialize express app
const app = express();

// Scream routes
app.get('/screams', FBAuth, getAllScreams);
app.post('/screams', FBAuth, postOneScream);

// User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
