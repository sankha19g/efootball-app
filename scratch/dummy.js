const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDpvjE8VgKVHH_OaPcgj6shiBomJm-oSnc",
  authDomain: "efootball-8c9c5.firebaseapp.com",
  projectId: "efootball-8c9c5",
  storageBucket: "efootball-8c9c5.firebasestorage.app",
  messagingSenderId: "218547227716",
  appId: "1:218547227716:web:a80b27553493e8d8af0011",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// In Firebase v9, there is no direct way to list all collections from web client SDK.
// But we can guess some collection names based on typical usage or we can read a known file.
// Let's check `test_db.js` for clues, or `badges` array in `BadgesScreen.js`.
