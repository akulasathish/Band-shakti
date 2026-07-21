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

export function formatDateTimeLocalInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseLocalDatetimeToISO(dateTimeStr) {
  if (!dateTimeStr) return null;
  const str = String(dateTimeStr).trim();
  if (str.includes('Z') || str.includes('+')) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Append IST offset +05:30 for bare datetime-local input strings
  const fullStr = str.length === 16 ? `${str}:00+05:30` : `${str}+05:30`;
  const d = new Date(fullStr);
  return isNaN(d.getTime()) ? new Date(str).toISOString() : d.toISOString();
}
