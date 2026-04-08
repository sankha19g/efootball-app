const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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
const GLOBAL_DB_COLLECTION = 'global_database';

async function checkSpecific(targetId) {
    console.log(`Checking for Player ID ${targetId} directly...`);
    const docRef = doc(db, GLOBAL_DB_COLLECTION, targetId);
    const d = await getDoc(docRef);
    
    if (d.exists()) {
        console.log('\nFOUND! Player is safe in your database.');
        console.log('ID:', d.id);
        console.log('Data:', JSON.stringify(d.data(), null, 2));
    } else {
        console.log(`\nPlayer ${targetId} NOT found in global_database.`);
        console.log('Searching in personal squad collection...');
        // We'll search in personal collection next if needed
    }
}

checkSpecific('106773960831286');
