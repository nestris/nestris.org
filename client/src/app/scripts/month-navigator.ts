import { BehaviorSubject } from "rxjs";

/**
 * MonthNavigator provides a reactive way to track and navigate through months.
 * 
 * - Starts with the current month and allows moving forward and backward.
 * - Uses a BehaviorSubject to emit updates whenever the month changes.
 * - Ensures that the day is always set to the first of the month to prevent date offset issues.
 * - Provides the month as a number (0-11), the year as a full number, and a formatted string (e.g., "February 2025").
 */
export class MonthNavigator {
  private date: Date; // Stores the current selected date
  private monthSubject: BehaviorSubject<{ month: number; year: number; string: string }>;

  constructor() {
    this.date = new Date();
    this.date.setDate(1); // Ensure the date is set to the first day of the month to avoid edge cases
    this.monthSubject = new BehaviorSubject(this.getMonthData()); // Initialize BehaviorSubject with the current month data
  }

  /**
   * Retrieves the current month, year, and a formatted string representation.
   */
  private getMonthData() {
    const month = this.date.getMonth(); // Month index (0 = Jan, 11 = Dec)
    const year = this.date.getFullYear(); // Full year (e.g., 2025)
    const string = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });

    return { month, year, string };
  }

  /**
   * Exposes an observable that emits updates when the month changes.
   */
  get month$() {
    return this.monthSubject.asObservable();
  }

  /**
   * Moves to the next month and updates the observable.
   */
  nextMonth(): void {
    this.date.setMonth(this.date.getMonth() + 1); // Increment month
    this.date.setDate(1); // Reset to the first day of the month
    this.monthSubject.next(this.getMonthData()); // Emit new month data
  }

  /**
   * Moves to the previous month and updates the observable.
   */
  previousMonth(): void {
    this.date.setMonth(this.date.getMonth() - 1); // Decrement month
    this.date.setDate(1); // Reset to the first day of the month
    this.monthSubject.next(this.getMonthData()); // Emit new month data
  }
}