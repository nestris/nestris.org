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

export function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}