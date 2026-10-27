// Utility to format friendly timestamps with exact hour and date in Spanish (es-MX)

export const formatDisplayTime = (rawTime?: string | number): string => {
  if (!rawTime) return 'Justo ahora';

  // Check if rawTime is already a formatted string that isn't ISO or numeric
  if (
    typeof rawTime === 'string' &&
    (rawTime.includes('Hoy a las') ||
     rawTime.includes('Ayer a las') ||
     rawTime.includes('Justo ahora') ||
     rawTime.includes('Hace un momento'))
  ) {
    // If it's a legacy static string, keep it clean
    return rawTime;
  }

  let date: Date;
  if (typeof rawTime === 'number') {
    date = new Date(rawTime);
  } else if (/^\d+$/.test(rawTime)) {
    date = new Date(Number(rawTime));
  } else {
    date = new Date(rawTime);
  }

  if (isNaN(date.getTime())) {
    return String(rawTime);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  // Exact time string e.g. "6:35 p. m."
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // If in the future or under 1 minute
  if (diffMins < 1) {
    return `Justo ahora (${timeStr})`;
  }

  // Under 60 minutes
  if (diffMins < 60) {
    return `Hace ${diffMins} min (${timeStr})`;
  }

  // Same calendar day
  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  if (isToday) {
    return `Hoy a las ${timeStr}`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getDate() === date.getDate() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getFullYear() === date.getFullYear();

  if (isYesterday) {
    return `Ayer a las ${timeStr}`;
  }

  // Different day e.g. "26 oct, 6:35 p. m."
  const dateStr = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });

  return `${dateStr}, ${timeStr}`;
};

export const getCurrentTimestampIso = (): string => {
  return new Date().toISOString();
};
