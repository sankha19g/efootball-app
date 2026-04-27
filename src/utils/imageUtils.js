/**
 * Utility to extract the most reliable image/logo/badge URL from a player object.
 * Handles multiple field name variations and protocol issues (e.g. // instead of https://).
 */
export const getPlayerBadge = (player, type = 'club', imageSource = 1) => {
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
      player.club_badge_url,
      player.clubBadgeUrl,
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
  } else {
    // Generic player photo extraction based on source selection
    if (imageSource === 2) {
      urls.push(player.image2, player.player_image2, player.playerImage2);
    } else if (imageSource === 3) {
      const pid = player.id || player.playerId || player.pesdb_id || (player._id && !player._id.includes('_') ? player._id : null);
      if (pid) {
        urls.push(`https://efimg.com/efootballhub22/images/player_cards/${pid}_l.png`);
      }
      urls.push(player.image3, player.player_image3, player.playerImage3);
    }
    
    // Always fallback to default source 1 fields if selection doesn't yield anything
    urls.push(
      player.image,
      player.photo,
      player.player_image,
      player.playerImage
    );
  }

  // Find the first valid string URL
  let logoUrl = urls.find(u => u && typeof u === 'string' && u.trim().length > 5);
  
  if (!logoUrl) return '';

  // Standardize protocol
  if (logoUrl.startsWith('//')) {
    logoUrl = `https:${logoUrl}`;
  } else if (!logoUrl.startsWith('http')) {
    logoUrl = `https://${logoUrl}`;
  }

  // Handle ImgBB links
  if (logoUrl.includes('ibb.co') && !logoUrl.includes('i.ibb.co')) {
    logoUrl = logoUrl.replace('ibb.co/', 'i.ibb.co/');
  }

  return logoUrl.trim();
};
