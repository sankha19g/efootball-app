const { initializeApp } = require('firebase/app');
const { getFirestore, doc, writeBatch } = require('firebase/firestore');
const fs = require('fs');

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
const JSON_PATH = 'c:/Users/ADMIN/Documents/GitHub/efootball/server/data/pesdb_players.json';

async function restoreOrderCorrectly() {
    console.log('--- RESTORING PLAYER ORDER WHILE PRESERVING MANUAL CARDS ---');
    
    if (!fs.existsSync(JSON_PATH)) {
        console.error('JSON source not found!');
        process.exit(1);
    }

    const players = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`Processing ${players.length} background players...`);

    // We use a HISTORICAL date (Jan 1st, 2020) for the scraped players.
    // This ensures they stay at the BOTTOM of the "Recent" list.
    // Your manual players already have newer dates, so they'll stay at the TOP.
    const historicalStart = new Date('2020-01-01T00:00:00Z').getTime();
    
    let updatedCount = 0;
    let batch = writeBatch(db);
    let batchSize = 0;

    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        // Sequential but OLD timestamps
        const timeObj = new Date(historicalStart + i * 1000);
        const isoTime = timeObj.toISOString();

        const docRef = doc(db, GLOBAL_DB_COLLECTION, String(p.id));
        
        // We only update lastUpdated and db_index. 
        // We do NOT overwrite other fields to be safe.
        batch.set(docRef, {
            lastUpdated: isoTime,
            db_index: i
        }, { merge: true });

        batchSize++;
        updatedCount++;

        if (batchSize === 400) {
            process.stdout.write(`Repositioning... ${updatedCount}/${players.length} \r`);
            await batch.commit();
            batch = writeBatch(db);
            batchSize = 0;
            await new Promise(r => setTimeout(r, 100)); // Be gentle with the quota
        }
    }

    if (batchSize > 0) {
        await batch.commit();
    }

    console.log('\n\n=============================================');
    console.log('SUCCESS! ALL 11,000+ PLAYERS RE-INDEXED!');
    console.log('JSON players moved to historical archive (2020).');
    console.log('Your MANUAL players are now at the TOP again.');
    console.log('=============================================\n');
    process.exit(0);
}

restoreOrderCorrectly().catch(err => {
    console.error('\nRESTORE FAILED:', err.message);
    process.exit(1);
});
