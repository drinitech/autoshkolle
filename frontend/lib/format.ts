// toLocaleDateString('sq-AL', ...) silently falls back to English in browsers
// whose bundled ICU data doesn't include Albanian — format manually instead.
const WEEKDAYS = ['E Diel', 'E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë'];
const MONTHS = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
];

// Slot/lesson dates are date-only values serialized as UTC midnight — read them
// back with the UTC getters so a negative local timezone offset can't shift
// the calendar day by one.
export function formatDateLong(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function formatDateShort(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
}
