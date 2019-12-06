const { admin, db } = require('../utils/admin');

exports.getAllScreams = (request, response) => {
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
};

exports.postOneScream = (request, response) => {
  const newScream = {
    body: request.body.body,
    userHandle: request.user.handle,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
  };

  db.collection('screams')
    .add(newScream)
    .then(documentRef => {
      documentRef.get().then(documentSnapshot => {
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
};
