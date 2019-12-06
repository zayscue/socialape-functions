const admin = require('firebase-admin');

// Initialize firebase admin app
admin.initializeApp();
let db = admin.firestore();

module.exports = { admin, db };
