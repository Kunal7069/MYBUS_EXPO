/**
 * Location utility functions for calculating distances and finding nearby coordinates
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Calculate the distance between two coordinates using the Haversine formula
   * @param {Object} coords1 - First coordinate {lat: number, lng: number}
   * @param {Object} coords2 - Second coordinate {lat: number, lng: number}
   * @returns {number} Distance in kilometers
   */
  function haversineDistance(coords1, coords2) {
    const R = 6371; // Radius of the Earth in kilometers
  
    const lat1 = toRadians(coords1.lat);
    const lng1 = toRadians(coords1.lng);
    const lat2 = toRadians(coords2.lat);
    const lng2 = toRadians(coords2.lng);
  
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c; // Distance in kilometers
  
    return distance;
  }
  
  /**
   * Find coordinates within a specified range of a center point
   * @param {Object} centerCoords - Center coordinate {lat: number, lng: number}
   * @param {Array} coordsArray - Array of coordinates to check
   * @param {number} range - Range in kilometers
   * @returns {Array} Array of coordinates within the specified range
   */
  function findCoordinatesWithinRange(centerCoords, coordsArray, range) {
    return coordsArray.filter(
      (coords) => haversineDistance(centerCoords, coords) <= range
    );
  }
  
  module.exports = {
    toRadians,
    haversineDistance,
    findCoordinatesWithinRange
  };