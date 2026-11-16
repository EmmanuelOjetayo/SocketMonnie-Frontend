/**
 * Client-side age gate helpers (minimum registration age: 18).
 *
 * Mirrors the backend source of truth (`Backend/Utilis/ageValidation.js`) so
 * the registration UI can prevent underage applicants before submit while the
 * backend independently enforces the same rule server-side.
 */

export const MINIMUM_REGISTRATION_AGE = 18;

export const parseDobUtcMidnight = (dob) => {
  if (dob === null || dob === undefined || dob === "") return null;
  const d = dob instanceof Date ? dob : new Date(dob);
  const time = d.getTime();
  if (Number.isNaN(time)) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export const calculateAge = (dob) => {
  const dobUtc = parseDobUtcMidnight(dob);
  if (dobUtc === null) return null;
  const birth = new Date(dobUtc);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
};

export const isEligibleDob = (dob) => {
  const dobUtc = parseDobUtcMidnight(dob);
  if (dobUtc === null) return false;
  const nowUtcMidnight = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  );
  if (dobUtc > nowUtcMidnight) return false;
  const age = calculateAge(dob);
  return age !== null && age >= MINIMUM_REGISTRATION_AGE;
};

/**
 * Latest permissible date of birth for an 18+ applicant — the current date
 * minus 18 years (month/day aware, so someone who turns 18 today is eligible).
 */
export const getMaxDob = () => {
  const now = new Date();
  const max = new Date(now.getFullYear() - MINIMUM_REGISTRATION_AGE, now.getMonth(), now.getDate());
  const mm = String(max.getMonth() + 1).padStart(2, "0");
  const dd = String(max.getDate()).padStart(2, "0");
  return `${max.getFullYear()}-${mm}-${dd}`;
};

export default isEligibleDob;
