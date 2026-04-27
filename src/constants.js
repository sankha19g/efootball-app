export const PLAYSTYLES = [
  'None', 'Goal Poacher', 'Fox in the Box', 'Target Man', 'Deep-lying Forward',
  'Dummy Runner', 'Prolific Winger', 'Roaming Flank', 'Cross Specialist',
  'Creative Playmaker', 'Hole Player', 'Box-to-Box', 'Orchestrator',
  'Anchor Man', 'Classic No. 10', 'Build Up', 'The Destroyer',
  'Extra Frontman', 'Attacking Full-back', 'Defensive Full-back',
  'Full-back Finisher', 'Offensive Goalkeeper', 'Defensive Goalkeeper'
];

export const TOP_LEAGUES = [
  'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
  'Eredivisie', 'Liga Portugal', 'Saudi Pro League', 'MLS', 'Brasileirão'
];

export const STAT_OPTIONS = [
  { id: 'matches', label: 'Matches', short: 'M' },
  { id: 'goals', label: 'Goals', short: 'G' },
  { id: 'assists', label: 'Assists', short: 'A' },
  { id: 'totalGA', label: 'G+A', short: 'GA' },
];

export const POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'SS', 'CF'
];

export const CARD_TYPES = [
  'Standard', 'POTW', 'Featured', 'Epic', 'Big Time', 'Show Time', 'Highlight', 'Legendary', 'Trend'
];

export const SPECIAL_SKILLS = [
  "Blitz Curler", "Long-Reach Tackle", "Acceleration Burst", "Phenomenal Pass", "Momentum Dribbling",
  "Phenomenal Finishing", "Magnetic Feet", "Attack Trigger", "Aerial Fort", "Edged Crossing",
  "Low Screamer", "Bullet Header", "Visionary Pass", "Willpower", "Fortress",
  "Game-Changing Pass", "GK Directing Defense", "GK Spirit Roar"
];

export const PLAYER_SKILLS = [
  "Acrobatic Finishing", "Chip Shot Control", "Dipping Shot", "First-time Shot", "Heading", "Knuckle Shot", "Long-Range Curler", "Long-Range Shooting", "Rising Shot", "Outside Curler",
  "Heel Trick", "Low Lofted Pass", "No Look Pass", "One-touch Pass", "Pinpoint Crossing", "Through Passing", "Weighted Pass",
  "Chop Turn", "Cut Behind & Turn", "Double Touch", "Flip Flap", "Gamesmanship", "Marseille Turn", "Rabona", "Scissors Feint", "Scotch Move", "Sole Control", "Sombrero",
  "Aerial Superiority", "Acrobatic Clear", "Blocker", "Interception", "Man Marking", "Sliding Tackle",
  "GK High Punt", "GK Long Throw", "GK Low Punt", "GK Penalty Saver",
  "Captaincy", "Fighting Spirit", "Penalty Specialist", "Super-sub", "Track Back"
];

export const ALL_SKILLS = [...SPECIAL_SKILLS, ...PLAYER_SKILLS];

export const PREFERRED_FOOT = ['Right', 'Left'];
export const WF_USAGE = ['Almost Never', 'Rarely', 'Occasionally', 'Regularly'];
export const WF_ACCURACY = ['Low', 'Medium', 'High', 'Very High'];
export const INJURY_RES = ['Low', 'Medium', 'High'];
export const FORM = ['Inconsistent', 'Standard', 'Unwavering'];

export const COLORS = {
  accent: '#00FF88',
  blue: '#00C3FF',
  dark: '#080809',
  darker: '#0a0a0c',
  card: '#111114',
  border: 'rgba(255,255,255,0.1)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.4)',
  danger: '#FF4444',
  warning: '#FFB800',
  success: '#00FF88',
};

export const getCardGradient = (type) => {
  switch (type?.toLowerCase().replace(/\s/g, '')) {
    case 'legendary': return ['#b8860b', '#8B6914'];
    case 'potw': return ['#006994', '#004e6b'];
    case 'featured': return ['#5b2d8e', '#3d1a6b'];
    case 'epic': return ['#8B008B', '#6B006B'];
    case 'bigtime': return ['#8B0000', '#6B0000'];
    case 'showtime': return ['#FF6B00', '#CC5500'];
    case 'highlights': return ['#006400', '#004B00'];
    case 'trendstars': return ['#1a1a3e', '#0d0d27'];
    default: return ['#1a3a6b', '#0d2147'];
  }
};

export const SQUAD_FORMATIONS = {
  '4-3-3': [
    { pos: 'GK', x: 50, y: 88, role: 'GK' },
    { pos: 'CB', x: 35, y: 72, role: 'CB' }, { pos: 'CB', x: 65, y: 72, role: 'CB' },
    { pos: 'LB', x: 15, y: 68, role: 'LB' }, { pos: 'RB', x: 85, y: 68, role: 'RB' },
    { pos: 'CMF', x: 50, y: 52, role: 'CMF' }, { pos: 'CMF', x: 28, y: 48, role: 'CMF' }, { pos: 'CMF', x: 72, y: 48, role: 'CMF' },
    { pos: 'LWF', x: 20, y: 22, role: 'LWF' }, { pos: 'RWF', x: 80, y: 22, role: 'RWF' }, { pos: 'CF', x: 50, y: 12, role: 'CF' }
  ],
  '4-4-2': [
    { pos: 'GK', x: 50, y: 88, role: 'GK' },
    { pos: 'CB', x: 35, y: 72, role: 'CB' }, { pos: 'CB', x: 65, y: 72, role: 'CB' },
    { pos: 'LB', x: 15, y: 68, role: 'LB' }, { pos: 'RB', x: 85, y: 68, role: 'RB' },
    { pos: 'LMF', x: 15, y: 42, role: 'LMF' }, { pos: 'RMF', x: 85, y: 42, role: 'RMF' },
    { pos: 'CMF', x: 35, y: 48, role: 'CMF' }, { pos: 'CMF', x: 65, y: 48, role: 'CMF' },
    { pos: 'CF', x: 35, y: 18, role: 'CF' }, { pos: 'CF', x: 65, y: 18, role: 'CF' }
  ],
  '3-2-4-1': [
    { pos: 'GK', x: 50, y: 88, role: 'GK' },
    { pos: 'CB', x: 50, y: 72, role: 'CB' }, { pos: 'CB', x: 25, y: 72, role: 'CB' }, { pos: 'CB', x: 75, y: 72, role: 'CB' },
    { pos: 'DMF', x: 35, y: 58, role: 'DMF' }, { pos: 'DMF', x: 65, y: 58, role: 'DMF' },
    { pos: 'AMF', x: 35, y: 38, role: 'AMF' }, { pos: 'AMF', x: 65, y: 38, role: 'AMF' },
    { pos: 'LMF', x: 15, y: 38, role: 'LMF' }, { pos: 'RMF', x: 85, y: 38, role: 'RMF' },
    { pos: 'CF', x: 50, y: 12, role: 'CF' }
  ],
  'CUSTOM': [
    { pos: 'GK', x: 50, y: 88, role: 'GK' },
    { pos: 'CB', x: 35, y: 72, role: 'CB' }, { pos: 'CB', x: 65, y: 72, role: 'CB' },
    { pos: 'LB', x: 15, y: 68, role: 'LB' }, { pos: 'RB', x: 85, y: 68, role: 'RB' },
    { pos: 'CMF', x: 50, y: 52, role: 'CMF' }, { pos: 'CMF', x: 28, y: 48, role: 'CMF' }, { pos: 'CMF', x: 72, y: 48, role: 'CMF' },
    { pos: 'LWF', x: 20, y: 22, role: 'LWF' }, { pos: 'RWF', x: 80, y: 22, role: 'RWF' }, { pos: 'CF', x: 50, y: 12, role: 'CF' }
  ]
};

