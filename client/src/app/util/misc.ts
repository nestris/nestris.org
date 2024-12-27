// if the event is for an input field, don't process it
export function eventIsForInput(event: any): boolean {
    try {
      return ["TEXTAREA", "INPUT"].includes(event.target.tagName);
    } catch {
      return false;
    }
  }

// sleep for ms milliseconds
export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function numberWithCommas(x: number | string): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Convert a hex color to an rgba color with the specified alpha
export const hexWithAlpha = (hex: string, alpha: number) => {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime(); // diff in milliseconds
  
  // If the date is in the future
  if (diff < 0) {
    return "In the future";
  }

  // Convert milliseconds into total seconds
  const totalSeconds = Math.floor(diff / 1000);

  // Calculate time units
  const days = Math.floor(totalSeconds / 86400); // 60*60*24
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  if (hours > 0) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  if (minutes > 0) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  // Less than a minute
  if (seconds <= 5) {
    return "A moment ago";
  } else {
    return `${seconds} seconds ago`;
  }
}

export function addSignPrefix(number: number): string {
  return number >= 0 ? `+${number}` : `${number}`;
}