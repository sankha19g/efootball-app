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
  console.log('Fetching global_database...');
  const snapshot = await getDocs(collection(db, 'global_database'));
  
  const clubs = new Set();
  const nationals = new Set();
  const leagues = new Set();
  
  snapshot.forEach(doc => {
    const p = doc.data();
    
    // Club
    const clubName = p.club || p.team_name || p.team;
    if (clubName && clubName !== 'Unknown' && clubName !== 'Free Agents') {
      clubs.add(clubName);
    }
    
    // National
    const nationName = p.nationality || p.country;
    if (nationName && nationName !== 'Unknown') {
      nationals.add(nationName);
    }
    
    // League
    const leagueName = p.league;
    if (leagueName && leagueName !== 'Unknown' && leagueName !== 'Free Agent') {
      leagues.add(leagueName);
    }
  });
  
  console.log(`Total Unique Clubs: ${clubs.size}`);
  console.log(`Total Unique Nationals: ${nationals.size}`);
  console.log(`Total Unique Leagues: ${leagues.size}`);
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
