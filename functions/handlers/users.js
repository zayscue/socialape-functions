const firebase = require('firebase');
const { admin, db } = require('../utils/admin');
const config = require('../utils/config');

const { validateSignup, validateLogin } = require('../utils/validators');
const { reduceUserDetails } = require('../utils/reducers');

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

  const noImg = 'no-img.png';

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
              createdAt: admin.firestore.Timestamp.fromDate(new Date()),
              imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`
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

exports.uploadImage = (request, response) => {
  const BusBoy = require('busboy');
  const uuid = require('uuid');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: request.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return response.status(400).json({ error: 'Wrong file type submitted ' });
    }

    const imageExtension = filename.split('.').pop();
    imageFileName = `${uuid.v4()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db
          .doc(`/users/${request.user.handle}`)
          .update({ imageUrl: imageUrl });
      })
      .then(() => {
        return response.json({ message: 'Image uploaded successfully' });
      })
      .catch(err => {
        console.error(err);
        return response.status(500).json({ error: err.code });
      });
  });
  busboy.end(request.rawBody);
};

exports.addUserDetails = (request, response) => {
  const userDetails = reduceUserDetails(request.body);

  db.doc(`/users/${request.user.handle}`)
    .update({ ...userDetails })
    .then(() => {
      return response.json({ message: 'Details added successfully' });
    })
    .catch(err => {
      console.error(err);
      return response.status(500).json({ error: err.code });
    });
};

exports.getAuthenticatedUser = (request, response) => {
  let userData = {};
  db.doc(`/users/${request.user.handle}`)
    .get()
    .then(documentSnapshot => {
      if (documentSnapshot.exists) {
        userData.credentials = documentSnapshot.data();
        return db
          .collection('likes')
          .where('userHandle', '==', request.user.handle)
          .get();
      }
      return response.status(403).json({ error: 'User not found' });
    })
    .then(querySnapshot => {
      userData.likes = [];
      querySnapshot.forEach(likesDocumentSnapshot => {
        userData.likes.push(likesDocumentSnapshot.data());
      });
      return response.json(userData);
    })
    .catch(err => {
      console.error(err);
      return response.status(500).json({ error: err.code });
    });
};
