const pad2 = (value: number): string => value.toString().padStart(2, '0');

export const toLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
};
