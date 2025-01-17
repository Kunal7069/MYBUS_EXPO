/**
 * Time utility functions for managing bus schedules and checking conflicts
 */

/**
 * Convert time string to minutes
 * @param {string} time - Time in format "HH:MM"
 * @returns {number} Total minutes
 */
function convertToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Convert minutes to time string
   * @param {number} minutes - Total minutes
   * @returns {string} Time in format "HH:MM"
   */
  function convertMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }
  
  /**
   * Check for time conflicts in bus schedules
   * @param {Array} data - Array of bus schedule data
   * @returns {Array} Array of conflicts found
   */
  function checkBusTimeConflicts(data) {
    const timeTableMap = {}; // Maps day -> array of {startTime, endTime, station}
    const conflicts = []; // Array to collect all conflicts
  
    for (const entry of data) {
      const { days, timetable } = entry;
  
      for (const day of days) {
        if (!timeTableMap[day]) {
          timeTableMap[day] = []; // Initialize the day array
        }
  
        for (const schedule of timetable) {
          const { station, arrival_time, departure_time } = schedule;
  
          const arrivalInMinutes = convertToMinutes(arrival_time);
          const departureInMinutes = convertToMinutes(departure_time);
  
          // Check for any overlapping time range on the same day
          for (const record of timeTableMap[day]) {
            if (
              (arrivalInMinutes >= record.startTime && arrivalInMinutes < record.endTime) ||
              (departureInMinutes > record.startTime && departureInMinutes <= record.endTime) ||
              (arrivalInMinutes <= record.startTime && departureInMinutes >= record.endTime)
            ) {
              // Add conflict to the array
              conflicts.push({
                day,
                conflictingStations: [station, record.station],
                conflictingTimes: [
                  { 
                    station, 
                    arrival_time, 
                    departure_time 
                  },
                  {
                    station: record.station,
                    arrival_time: convertMinutesToTime(record.startTime),
                    departure_time: convertMinutesToTime(record.endTime)
                  }
                ]
              });
            }
          }
  
          // Add the current time range to the map
          timeTableMap[day].push({
            startTime: arrivalInMinutes,
            endTime: departureInMinutes,
            station
          });
        }
      }
    }
  
    return conflicts;
  }
  
  /**
   * Validate time format
   * @param {string} time - Time string to validate
   * @returns {boolean} True if time format is valid
   */
  function isValidTimeFormat(time) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
  
  /**
   * Compare two times
   * @param {string} time1 - First time
   * @param {string} time2 - Second time
   * @returns {number} -1 if time1 < time2, 0 if equal, 1 if time1 > time2
   */
  function compareTime(time1, time2) {
    const minutes1 = convertToMinutes(time1);
    const minutes2 = convertToMinutes(time2);
    
    if (minutes1 < minutes2) return -1;
    if (minutes1 > minutes2) return 1;
    return 0;
  }
  
  /**
   * Calculate duration between two times
   * @param {string} startTime - Start time
   * @param {string} endTime - End time
   * @returns {number} Duration in minutes
   */
  function calculateDuration(startTime, endTime) {
    const start = convertToMinutes(startTime);
    const end = convertToMinutes(endTime);
    return end - start;
  }
  
  module.exports = {
    convertToMinutes,
    convertMinutesToTime,
    checkBusTimeConflicts,
    isValidTimeFormat,
    compareTime,
    calculateDuration
  };