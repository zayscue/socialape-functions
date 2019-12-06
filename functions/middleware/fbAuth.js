const { admin, db } = require('../utils/admin');

module.exports = (request, response, next) => {
  if (
    !(
      request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer ')
    )
  ) {
    console.error('No token found');
    return response.status(403).json({ error: 'Unauthorized' });
  }
  const idToken = request.headers.authorization.split('Bearer ')[1];

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedIdToken => {
      request.user = decodedIdToken;
      db.collection('users')
        .where('userId', '==', request.user.uid)
        .limit(1)
        .get()
        .then(querySnapshot => {
          const data = querySnapshot.docs[0].data();
          request.user.handle = data.handle;
          return next();
        })
        .catch(err => {
          console.error('Error while verifying token ', err);
          return response.status(403).json(err);
        });
    })
    .catch(err => {
      console.error('Error while verifying token ', err);
      return response.status(403).json(err);
    });
};
