// Declare the module with a basic structure. This can be as detailed as you need.
declare const Module: {
  onRuntimeInitialized: any;
  _getLockValueLookup(input: string): string;
  _getMove(input: string): string;
  _getTopMoves(input: string): string;
  _rateMove(input: string): string;
};

// A function to ensure the module is ready before calling any functions
function whenModuleReady(): Promise<void> {
  return new Promise<void>(resolve => {
      Module.onRuntimeInitialized = resolve;
  });
}

// Expose your WebAssembly functions as async functions
export async function getLockValueLookup(input: string): Promise<string> {
  await whenModuleReady();
  return Module._getLockValueLookup(input);
}

export async function getMove(input: string): Promise<string> {
  await whenModuleReady();
  return Module._getMove(input);
}

export async function getTopMoves(input: string): Promise<string> {
  await whenModuleReady();
  return Module._getTopMoves(input);
}

export async function rateMove(input: string): Promise<string> {
  await whenModuleReady();
  return Module._rateMove(input);
}
