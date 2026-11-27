import { format, isAfter, startOfToday } from "date-fns";

// Year range for the graduation date picker's year dropdown.
export const GRAD_FROM_YEAR = new Date().getFullYear() - 60;
export const GRAD_TO_YEAR = new Date().getFullYear() + 10;

/**
 * "Expected graduation · May 2027" for future dates,
 * "Graduated · May 2023" for past ones, or "" when no date is set.
 */
export const graduationStatus = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const when = format(d, "MMMM yyyy");
  return isAfter(d, startOfToday())
    ? `Expected graduation · ${when}`
    : `Graduated · ${when}`;
};
