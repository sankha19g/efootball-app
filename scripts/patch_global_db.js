const { initializeApp } = require('firebase/app');
const { getFirestore, collection, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

const PESDB_JSON_PATH = 'C:/Users/ADMIN/Documents/GitHub/efootball/server/data/pesdb_players.json';

async function patchPlayers() {
  console.log('--- Patching Global Database with timestamps ---');
  
  if (!fs.existsSync(PESDB_JSON_PATH)) {
    console.error('Error: pesdb_players.json not found');
    return;
  }

  const players = JSON.parse(fs.readFileSync(PESDB_JSON_PATH, 'utf8'));
  console.log(`Found ${players.length} players locally.`);

  const BATCH_SIZE = 500;
  const globalRef = collection(db, 'global_database');
  const now = new Date().toISOString();

  for (let i = 0; i < players.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = players.slice(i, i + BATCH_SIZE);

    chunk.forEach(player => {
      const pRef = doc(globalRef, player.id.toString());
      
      // Ensure search_name and lastUpdated exist
      const search_name = player.search_name || player.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      batch.set(pRef, { 
        ...player, 
        search_name,
        lastUpdated: now 
      }, { merge: true });
    });

    try {
      await batch.commit();
      console.log(`Patched batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + chunk.length}/${players.length})`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('--- Patch Completed ---');
  process.exit(0);
}

patchPlayers();
