// sleep time expects milliseconds
export function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }