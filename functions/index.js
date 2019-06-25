const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

// Initialize express app
const app = express();

// Initialize firebase app
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

app.get('/screams', (request, response) => {
  db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(querySnapshot => {
      let screams = [];
      querySnapshot.forEach(documentSnapshot => {
        const data = documentSnapshot.data();
        const scream = {
          id: documentSnapshot.id,
          ...data
        };
        screams.push(scream);
      });
      return response.json(screams);
    })
    .catch(err => console.error(err));
});

app.post('/screams', (request, respone) => {
  const newScream = {
    body: request.body.body,
    userHandle: request.body.userHandle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };

  db.collection('screams')
    .add(newScream)
    .then(documentRef => {
      documentRef.get().then(doc => {
        const data = documentSnapshot.data();
        const scream = {
          id: documentRef.id,
          ...data
        };
        respone.json(scream);
      });
    })
    .catch(err => {
      respone.status(500).json({ error: err });
    });
});

exports.api = functions.https.onRequest(app);
