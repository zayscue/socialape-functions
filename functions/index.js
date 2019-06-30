const functions = require('firebase-functions');
const firebase = require('firebase');
const admin = require('firebase-admin');
const express = require('express');

const firebaseConfig = {
};

// Initialize express app
const app = express();

// Initialize firebase admin app
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

// Initialize firebase app
firebase.initializeApp(firebaseConfig);

app.get('/helloworld', (request, response) => {
  response.status(200).json({ message: 'Hello World!' });
});

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

app.post('/screams', (request, response) => {
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
        response.status(201).json(scream);
      });
    })
    .catch(err => {
      console.error(err);
      response.status(500).json({ error: err });
    });
});

app.post('/signup', (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle
  };

  if (newUser.password !== newUser.confirmPassword) {
    return response
      .status(400)
      .json({ password: "Password and Confirm Password don't match." });
  }

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(documentSnapshot => {
      if (documentSnapshot.exists) {
        return response
          .status(400)
          .json({ handle: 'This handle is already taken.' });
      }
      firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(userCredentials => {
          const user = userCredentials.user;
          db.doc(`/users/${newUser.handle}`)
            .set({
              handle: newUser.handle,
              email: newUser.email,
              userId: user.uid,
              createdAt: admin.firestore.Timestamp.fromDate(new Date())
            })
            .then(() => {
              return response.status(201).json(user.toJSON());
            })
            .catch(setError => {
              console.error(setError);
              return response.status(500).json({ error: setError.code });
            });
        })
        .catch(err => {
          console.error(err);
          if (err.code === 'auth/email-already-in-use') {
            return response
              .status(400)
              .json({ email: 'Email is already in use.' });
          } else {
            return response.status(500).json({ error: err.code });
          }
        });
    })
    .catch(err => {
      console.error(err);
      return response.status(500).json({ error: err.code });
    });
});

exports.api = functions.https.onRequest(app);
