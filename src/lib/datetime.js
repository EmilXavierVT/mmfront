export const toDateTimePayload = (date, time) => {
  const value = new Date(date);
  const [hours, minutes] = time.split(':').map(Number);
  value.setHours(hours, minutes, 0, 0);
  const pad = (part) => String(part).padStart(2, '0');
  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
  ].join('-') + `T${pad(value.getHours())}:${pad(value.getMinutes())}:00`;
};

export const toTimePayload = (time) => `${time}:00`;
