
/**
 * Unified utility to extract secondary positions from a player object.
 * Handles various field names and formats (strings, arrays).
 */
export const getSecondaryPositionsFromPlayer = (player) => {
  if (!player) return [];
  
  // Potential field names for secondary positions
  const fieldFallbacks = [
    'additionalPositions',
    'secondaryPositions',
    'secondary_positions',
    'sec_pos',
    'additional_pos',
    'positions',
    'secondaryPosition',
    'secondary_pos',
    'secPos',
    'additionalPos',
    'pos2',
    'secondary'
  ];

  let allPositions = [];
  for (const field of fieldFallbacks) {
    const val = player[field];
    if (val) {
      let parsed = [];
      if (typeof val === 'string') {
        parsed = val.split(/[,|/ \s]+/).map(p => p.trim().toUpperCase());
      } else if (Array.isArray(val)) {
        parsed = val.map(p => (typeof p === 'string' ? p.trim().toUpperCase() : ''));
      }
      allPositions = [...allPositions, ...parsed];
    }
  }

  const positionsArray = allPositions.filter(p => p && p.length > 0);
  return [...new Set(positionsArray)];
};

/**
 * Standardizes the display logic for positions.
 */
export const formatPositionList = (positions) => {
  if (!Array.isArray(positions)) return '';
  return positions.join(' ');
};
