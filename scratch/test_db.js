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
  console.log('Checking global_database (5000 docs)...');
  const q = query(collection(db, 'global_database'), firestoreLimit(5000));
  const snapshot = await getDocs(q);
  let found = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.image3 || data.player_image3 || data.playerImage3 || data.image_3 || data.image_url_3) {
      console.log('FOUND IT in GLOBAL DB!');
      console.log('PLAYER ID:', doc.id);
      console.log('KEYS:', Object.keys(data).filter(k => k.toLowerCase().includes('image')));
      found++;
    }
  });
  console.log(`Finished. Found ${found} docs with image3.`);
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
