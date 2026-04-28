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

async function check() {
  console.log('Fetching badges collection...');
  try {
    const snapshot = await getDocs(collection(db, 'badges'));
    console.log(`Found ${snapshot.docs.length} documents in badges collection.`);
    let club = 0, national = 0, league = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'club') club++;
      else if (data.type === 'national') national++;
      else if (data.type === 'league') league++;
    });
    console.log(`Clubs: ${club}, Nationals: ${national}, Leagues: ${league}`);
  } catch (e) {
    console.log('Error or badges collection might not exist.', e);
  }
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
