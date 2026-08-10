// PoleSafe — SMS Response Templates
// Templates for SMS messages sent to basic phone parents
// Keeps messages under 160 characters when possible

module.exports = {

  /**
   * Unknown user — they SMS'd us but aren't registered
   */
  unknownUser(phone) {
    return `Welcome to PoleSafe! To register, ask your child's school to add your number (${phone}). Already registered? Reply HELP for commands.`;
  },

  /**
   * Help guide — shows available commands
   */
  helpGuide() {
    const lines = [
      'PoleSafe SMS Commands:',
      'BOOK Faith P.3 StMarys 7AM — Book a ride',
      'WHERE Faith — Track your child',
      'CANCEL Faith — Cancel today\'s ride',
      'SICK Faith — Report sick (free cancel)',
      'HELP Faith — Emergency alert',
      'RESTORE Faith — Undo sick day',
      'Or reply to any message from us.',
    ];
    return lines.join('\n');
  },

  /**
   * Ask for kid's name (booking flow)
   */
  askKidName(parentName) {
    return `${parentName}, what is your child's name? Reply with their full name.`;
  },

  /**
   * Ask for school name (booking flow)
   */
  askSchool(kidName) {
    return `Which school does ${kidName} attend? Reply with the school name.`;
  },

  /**
   * Booking confirmed
   */
  bookingConfirmed(kidName, time, schoolName) {
    return `✅ Booking confirmed! ${kidName} will be picked up at ${time} for ${schoolName}. You'll get SMS updates each morning. - PoleSafe`;
  },

  /**
   * Kid not found
   */
  kidNotFound(name) {
    return `Could not find a child named "${name}" on your account. Check the spelling or register them at your school.`;
  },

  /**
   * No active ride
   */
  noActiveRide(kidName) {
    return `${kidName} has no active ride right now. Check your booking or reply BOOK to schedule one.`;
  },

  /**
   * Current ride status
   */
  rideStatus(kidName, status, driverName, distance) {
    const statusText = {
      scheduled: '⏳ Pickup scheduled',
      en_route: '🚗 Driver is on the way',
      picked_up: '👧 Picked up — heading to school',
      dropped_off: '📍 Dropped off at school',
      gate_confirmed: '✅ Gate confirmed arrival',
      completed: '✅ Ride completed',
      cancelled: '❌ Ride cancelled',
    };

    return `${kidName} — ${statusText[status] || status}. Driver: ${driverName}. - PoleSafe`;
  },

  /**
   * Ride cancelled
   */
  rideCancelled(kidName) {
    return `✅ Cancelled rides for ${kidName}. No charge if cancelled early. Reply BOOK to rebook. - PoleSafe`;
  },

  /**
   * Sick day reported
   */
  sickDayReported(kidName, days) {
    const dayText = days === 1 ? 'today' : `for ${days} days`;
    return `🩺 ${kidName} marked sick ${dayText}. No charge. You have a credit of ${5000 * days} UGX. Reply RESTORE ${kidName} to undo.`;
  },

  /**
   * Emergency alerted
   */
  emergencyAlerted(kidName) {
    return `🚨 Emergency alert sent for ${kidName}. PoleSafe control room has been notified. You'll get a call shortly.`;
  },

  /**
   * Driver SMS templates (for basic phone drivers)
   */
  driverPickup(kidName, address, time) {
    return `PoleSafe: Pick up ${kidName} at ${address} at ${time}. Reply ARRIVED when there, PICKED when collected.`;
  },

  driverDropoff(kidName, school, time) {
    return `PoleSafe: Drop ${kidName} at ${school} by ${time}. Reply DROPPED when done.`;
  },

  /**
   * Schedule change notification
   */
  scheduleChange(kidName, newTime, schoolName) {
    return `📅 ${schoolName} changed pickup for ${kidName} to ${newTime}. Reply CONFIRM to accept.`;
  },

  /**
   * Broadcast from school
   */
  schoolBroadcast(schoolName, message) {
    const truncated = message.length > 120 ? message.substring(0, 117) + '...' : message;
    return `${schoolName}: ${truncated} -PoleSafe`;
  },
};
