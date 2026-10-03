import { startOfDay, endOfDay, startOfWeek, endOfWeek, addWeeks, isAfter, isBefore, isEqual, isSameDay } from "date-fns";

export type ValidationResult = {
  valid: boolean;
  message?: string;
  suggestedCategory?: string;
};

export function getNextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return startOfDay(d);
}

export function getThisSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return endOfDay(d);
}

export function validateDeadlineForCategory(deadline: Date | null | undefined, category: string): ValidationResult {
  if (!deadline) {
    return { valid: true };
  }

  const now = new Date();
  const today = startOfDay(now);
  const deadlineDate = startOfDay(new Date(deadline));
  
  const nextMonday = getNextMonday(now);
  const thisSunday = getThisSunday(now);
  const followingSunday = endOfDay(addWeeks(nextMonday, 1));
  followingSunday.setDate(followingSunday.getDate() - 1);

  switch (category) {
    case "ASAP":
      return { valid: true };
      
    case "Today":
      if (!isSameDay(deadlineDate, today)) {
        return {
          valid: false,
          message: "Tasks marked 'Today' must have a deadline of today",
          suggestedCategory: getSuggestedCategory(deadlineDate, now),
        };
      }
      return { valid: true };
      
    case "This Week":
      if (isBefore(deadlineDate, today)) {
        return {
          valid: false,
          message: "Deadline is in the past",
          suggestedCategory: "ASAP",
        };
      }
      if (!isBefore(deadlineDate, nextMonday) && !isSameDay(deadlineDate, today)) {
        return {
          valid: false,
          message: "Tasks marked 'This Week' must have a deadline before next Monday",
          suggestedCategory: getSuggestedCategory(deadlineDate, now),
        };
      }
      return { valid: true };
      
    case "Next Week":
      const nextWeekStart = nextMonday;
      const nextWeekEnd = endOfDay(addWeeks(nextMonday, 1));
      nextWeekEnd.setDate(nextWeekEnd.getDate() - 1);
      
      if (isBefore(deadlineDate, nextWeekStart)) {
        return {
          valid: false,
          message: "Tasks marked 'Next Week' must have a deadline starting next Monday",
          suggestedCategory: getSuggestedCategory(deadlineDate, now),
        };
      }
      if (isAfter(deadlineDate, nextWeekEnd)) {
        return {
          valid: false,
          message: "Tasks marked 'Next Week' must have a deadline by next Sunday",
          suggestedCategory: getSuggestedCategory(deadlineDate, now),
        };
      }
      return { valid: true };
      
    case "Eventually":
      const eventuallyStart = addWeeks(nextMonday, 1);
      if (isBefore(deadlineDate, eventuallyStart)) {
        return {
          valid: false,
          message: "Tasks marked 'Eventually' must have a deadline after next week",
          suggestedCategory: getSuggestedCategory(deadlineDate, now),
        };
      }
      return { valid: true };
      
    case "Parking Lot":
      return { valid: true };
      
    default:
      return { valid: true };
  }
}

export function getSuggestedCategory(deadline: Date, now: Date): string {
  const today = startOfDay(now);
  const deadlineDate = startOfDay(new Date(deadline));
  
  if (isBefore(deadlineDate, today)) {
    return "ASAP";
  }
  
  if (isSameDay(deadlineDate, today)) {
    return "Today";
  }
  
  const nextMonday = getNextMonday(now);
  if (isBefore(deadlineDate, nextMonday)) {
    return "This Week";
  }
  
  const nextWeekEnd = endOfDay(addWeeks(nextMonday, 1));
  nextWeekEnd.setDate(nextWeekEnd.getDate() - 1);
  if (!isAfter(deadlineDate, nextWeekEnd)) {
    return "Next Week";
  }
  
  return "Eventually";
}

export function checkTaskNeedsReview(deadline: Date | null | undefined, category: string): boolean {
  if (!deadline) return false;
  const result = validateDeadlineForCategory(deadline, category);
  return !result.valid;
}
