// if the event is for an input field, don't process it
export function eventIsForInput(event: any): boolean {
    try {
      return ["TEXTAREA", "INPUT"].includes(event.target.tagName);
    } catch {
      return false;
    }
  }