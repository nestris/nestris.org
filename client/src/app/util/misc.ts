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