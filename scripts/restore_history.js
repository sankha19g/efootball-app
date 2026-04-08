const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with just the project ID
// It will try to use application default credentials (ADC) 
// or pick up your current firebase login session.
admin.initializeApp({
    projectId: 'efootball-8c9c5'
});

const db = admin.firestore();
const GLOBAL_DB_COLLECTION = 'global_database';
const JSON_PATH = 'c:/Users/ADMIN/Documents/GitHub/efootball/server/data/pesdb_players.json';

async function restoreOrder() {
    console.log('--- Database Order Restoration ---');
    console.log('Reading JSON from:', JSON_PATH);
    
    if (!fs.existsSync(JSON_PATH)) {
        console.error('ERROR: pesdb_players.json not found at the specified path.');
        process.exit(1);
    }

    const rawData = fs.readFileSync(JSON_PATH, 'utf8');
    const players = JSON.parse(rawData);
    console.log(`Found ${players.length} players in JSON source.`);

    const startTime = new Date();
    let updatedCount = 0;
    let batch = db.batch();
    let batchSize = 0;

    console.log('Starting restoration (this may take a few minutes)...');
    
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        // Descending order: 
        // Player[0] is newest. 
        // We subtract seconds to make later players 'older'.
        const timeObj = new Date(startTime.getTime() - i * 1000);
        const isoTime = timeObj.toISOString();

        const docRef = db.collection(GLOBAL_DB_COLLECTION).doc(String(p.id));
        
        batch.set(docRef, {
            lastUpdated: isoTime,
            db_index: i // Permanent fallback index
        }, { merge: true });

        batchSize++;
        updatedCount++;

        if (batchSize === 500) {
            console.log(`Committed ${updatedCount}/${players.length}...`);
            await batch.commit();
            batch = db.batch();
            batchSize = 0;
            // Delay to avoid quota issues
            await new Promise(r => setTimeout(r, 200));
        }
    }

    if (batchSize > 0) {
        await batch.commit();
    }

    console.log('\n=====================================');
    console.log(`SUCCESS: ${updatedCount} players re-indexed!`);
    console.log('Chronological history has been restored.');
    console.log('=====================================\n');
    process.exit(0);
}

restoreOrder().catch(err => {
    console.error('\nRESTORE CRASHED:', err.message);
    if (err.message.includes('credential')) {
        console.log('\nTIP: Please run "firebase login" in your terminal before running this script.');
    }
    process.exit(1);
});
