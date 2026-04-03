/**
 * Utility to extract the most reliable image/logo/badge URL from a player object.
 * Handles multiple field name variations and protocol issues (e.g. // instead of https://).
 */
export const getPlayerBadge = (player, type = 'club') => {
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
    // Generic player photo extraction
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
