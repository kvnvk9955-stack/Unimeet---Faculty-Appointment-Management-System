import { isPast, parseISO } from 'date-fns';

export const isPastDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return true;
  try {
    let hours, minutes;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const [time, modifier] = timeStr.split(' ');
      [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
    } else {
      [hours, minutes] = timeStr.split(':').map(Number);
    }
    const d = parseISO(dateStr);
    d.setHours(hours, minutes, 0, 0);
    return isPast(d);
  } catch { return false; }
};
