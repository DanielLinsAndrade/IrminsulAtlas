export function farmDay(now: Date, utcOffset: number, resetHour = 6): { day: string; date: string } {
  const shifted = new Date(now.getTime() + (utcOffset - resetHour) * 3600000);
  return { day: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][shifted.getUTCDay()], date: shifted.toISOString().slice(0,10) };
}
