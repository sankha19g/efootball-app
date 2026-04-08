const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// THE EXACT CONFIG FROM YOUR APP
const firebaseConfig = {
  apiKey: "AIzaSyDpvjE8VgKVHH_OaPcgj6shiBomJm-oSnc",
  authDomain: "efootball-8c9c5.firebaseapp.com",
  projectId: "efootball-8c9c5",
  storageBucket: "efootball-8c9c5.firebasestorage.app",
  messagingSenderId: "218547227716",
  appId: "1:218547227716:web:a80b27553493e8d8af0011",
};

// Initialize Firebase using the Web SDK (Client) 
// This works because your Firestore rules are currently OPEN for write.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const GLOBAL_DB_COLLECTION = 'global_database';
const JSON_PATH = 'c:/Users/ADMIN/Documents/GitHub/efootball/server/data/pesdb_players.json';

async function restore() {
    console.log('--- STARTING GLOBAL PLAYER DATABASE RESTORATION ---');
    console.log('Source:', JSON_PATH);
    
    if (!fs.existsSync(JSON_PATH)) {
        console.error('CRITICAL ERROR: Source JSON file missing!');
        process.exit(1);
    }

    const players = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`Ready to process ${players.length} players...`);

    const startTime = new Date();
    let updatedCount = 0;
    let batch = writeBatch(db);
    let batchSize = 0;

    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        // Descending Order logic:
        // Index 0 in JSON = Newest (Today)
        // Index 1000 in JSON = 1000 seconds older
        const timeObj = new Date(startTime.getTime() - i * 1000);
        const isoTime = timeObj.toISOString();

        const docRef = doc(db, GLOBAL_DB_COLLECTION, String(p.id));
        
        batch.set(docRef, {
            lastUpdated: isoTime,
            db_index: i
        }, { merge: true });

        batchSize++;
        updatedCount++;

        if (batchSize === 500) {
            process.stdout.write(`Updating... ${updatedCount}/${players.length} \r`);
            await batch.commit();
            batch = writeBatch(db);
            batchSize = 0;
            // Short pause for reliability
            await new Promise(r => setTimeout(r, 100));
        }
    }

    if (batchSize > 0) {
        await batch.commit();
    }

    console.log('\n\n=============================================');
    console.log('SUCCESS! ALL PLAYERS RE-INDEXED!');
    console.log(`Total: ${updatedCount} players restored to original order.`);
    console.log('Your Website and App history are now FIXED.');
    console.log('=============================================\n');
    process.exit(0);
}

restore().catch(err => {
    console.error('\nFAILED:', err.message);
    process.exit(1);
});
