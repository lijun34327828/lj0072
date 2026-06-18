export function parseTimeToFloat(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}

export function formatFloatToTime(float: number): string {
  const hours = Math.floor(float);
  const minutes = Math.round((float - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function isTimeInRange(start: string, check: string, end: string): boolean {
  const startFloat = parseTimeToFloat(start);
  const checkFloat = parseTimeToFloat(check);
  const endFloat = parseTimeToFloat(end);
  return checkFloat >= startFloat && checkFloat <= endFloat;
}

export function addDurationToTime(startTime: string, duration: number): string {
  const startFloat = parseTimeToFloat(startTime);
  const endFloat = startFloat + duration;
  return formatFloatToTime(endFloat);
}

export function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
