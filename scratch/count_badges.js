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

const getPlayerBadge = (player, type = 'club') => {
  if (!player) return '';

  const urls = [];
  
  if (type === 'club') {
    urls.push(
      player.logos?.club,
      player.club_badge_url,
      player.clubBadgeUrl,
      player.club_logo,
      player.clubLogo,
      player.club_logo_url,
      player.clubLogoUrl,
      player.team_logo,
      player.teamLogo,
      player.team_logo_url,
      player.teamLogoUrl,
      player.team_badge,
      player.teamBadge,
      player.club_badge,
      player.clubBadge,
      player.logo_url,
      player.badge_url,
      player.logos?.clubBadge,
      player.logos?.club_badge
    );
  } else if (type === 'national') {
    urls.push(
      player.logos?.country,
      player.nationality_flag_url,
      player.nationalityFlagUrl,
      player.nationFlagUrl,
      player.nation_flag,
      player.nationFlag,
      player.country_badge,
      player.countryBadge,
      player.nation_badge,
      player.nationBadge,
      player.nation_logo,
      player.nationLogo,
      player.nationality_logo,
      player.nationalityLogo,
      player.logos?.nationBadge,
      player.logos?.nation_badge
    );
  } else if (type === 'league') {
    urls.push(
      player.logos?.league,
      player.league_logo,
      player.leagueLogo,
      player.league_badge,
      player.leagueBadge,
      player.logos?.leagueBadge,
      player.logos?.league_badge
    );
  }

  let logoUrl = urls.find(u => u && typeof u === 'string' && u.trim().length > 5);
  return logoUrl ? logoUrl.trim() : '';
};

async function check() {
  console.log('Fetching global_database...');
  const snapshot = await getDocs(collection(db, 'global_database'));
  
  const clubs = new Map();
  const nationals = new Map();
  const leagues = new Map();
  
  let totalPlayers = 0;
  
  snapshot.forEach(doc => {
    totalPlayers++;
    const p = doc.data();
    
    // Club
    const clubName = p.club || p.team_name || p.team;
    if (clubName) {
      const logo = getPlayerBadge(p, 'club');
      if (logo) clubs.set(clubName, logo);
    }
    
    // National
    const nationName = p.nationality || p.country;
    if (nationName) {
      const logo = getPlayerBadge(p, 'national');
      if (logo) nationals.set(nationName, logo);
    }
    
    // League
    const leagueName = p.league;
    if (leagueName) {
      const logo = getPlayerBadge(p, 'league');
      if (logo) leagues.set(leagueName, logo);
    }
  });
  
  console.log(`Total Players: ${totalPlayers}`);
  console.log(`Total Unique Club Badges: ${clubs.size}`);
  console.log(`Total Unique National Badges: ${nationals.size}`);
  console.log(`Total Unique League Badges: ${leagues.size}`);
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
