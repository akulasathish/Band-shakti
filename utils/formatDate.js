// Helper utility for dynamic date and time formatting across Band Shakthi web app
export function formatEventDateTime(dateString) {
  if (!dateString) return 'Date TBD';
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;

    // Formats into clean IST time e.g., "Fri, Jul 28, 2026, 8:00 PM Onwards"
    return dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' Onwards';
  } catch (e) {
    return dateString;
  }
}

export function formatShortEventDate(dateString) {
  if (!dateString) return 'TBD';
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;

    return dateObj.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}
