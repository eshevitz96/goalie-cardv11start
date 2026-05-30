export const SPORT_DIMENSIONS = {
  'Hockey': {
    length: 89, // Goal line to center
    width: 85,
    goalLineToBoards: 11,
    creaseRadius: 6,
    faceoffCircleRadius: 15,
    faceoffDotDist: 22,
  },
  'Mens Lacrosse': {
    length: 120, // 40 yards
    width: 180, // 60 yards
    creaseRadius: 9,
    boxWidth: 40 * 3, // 40 yards
    boxDepth: 20 * 3, // 20 yards
  },
  'Womens Lacrosse': {
    length: 135, // 45 yards
    width: 210, // 70 yards
    creaseRadius: 8.5,
    arc8m: 8 * 3,
    fan12m: 12 * 3,
  },
  'Soccer': {
    length: 180, // 60 yards
    width: 225, // 75 yards
    penaltyAreaWidth: 44 * 3,
    penaltyAreaDepth: 18 * 3,
    goalAreaWidth: 20 * 3,
    goalAreaDepth: 6 * 3,
    penaltySpotDist: 12 * 3,
  },
  'Field Hockey': {
    length: 150, // 50 yards
    width: 180, // 60 yards
    shootingCircleRadius: 16 * 3,
    penaltySpotDist: 7 * 3,
  }
};
