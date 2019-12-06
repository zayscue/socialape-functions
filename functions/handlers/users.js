const firebase = require('firebase');
const { db } = require('../utils/admin');
const config = require('../utils/config');

const { validateSignup, validateLogin } = require('../utils/validators');

firebase.initializeApp(config);

exports.signup = (request, response) => {
  const newUser = {
    email: request.body.email,
    password: request.body.password,
    confirmPassword: request.body.confirmPassword,
    handle: request.body.handle
  };

  const validationResults = validateSignup(newUser);
  if (!validationResults.valid) {
    return response.status(400).json(validationResults.errors);
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
};

exports.login = (request, response) => {
  const user = {
    email: request.body.email,
    password: request.body.password
  };

  const validationResults = validateLogin(user);
  if (!validationResults.valid) {
    return response.status(400).json(validationResults.errors);
  }

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(userCredentials => {
      return response.json(userCredentials.user.toJSON());
    })
    .catch(err => {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        return response
          .status(403)
          .json({ general: 'Wrong credentials, please try again' });
      }
      return response.status(500).json({ error: err.code });
    });
};
