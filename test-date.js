const now = new Date("2026-04-27T00:00:00");
const displayDate = "08/06/2025";
const dateString = displayDate.replace(/\s+/g, '');
const dateParts = dateString.split(/[-/]/);
let eventDate = new Date(0);
if (dateParts.length >= 2) {
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  let year = new Date().getFullYear(); // Wait, in the node script new Date() is the system time, but whatever
  if (dateParts.length >= 3) {
    year = parseInt(dateParts[2]);
    if (year < 100) year += 2000;
  }
  if (!isNaN(day) && !isNaN(month)) {
    eventDate = new Date(year, month, day);
  }
}
console.log("eventDate:", eventDate, "now:", now, "Is upcoming?", eventDate >= now);
