/// <reference lib="webworker" />

declare const Module: any;
var API: any;

const attemptParse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

addEventListener('message', async (event: MessageEvent<{id: number, endpoint: string, parameters: string}>) => {

  const { id, endpoint, parameters } = event.data;

  if (endpoint == 'echo') {

    // Simulate a delay for the echo endpoint
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send the result back to the main thread
    postMessage({ id, result: parameters });
  }

  try {
    // Ensure the endpoint corresponds to a valid function in the Module
    if (typeof API[endpoint] !== 'function') {
      postMessage({ id, result: `Invalid endpoint: ${endpoint}` });
      return;
    }

    // Call the function dynamically and parse the JSON response
    const rawRes = API[endpoint](parameters);
    const result = attemptParse(rawRes);

    // Send the result back to the main thread
    postMessage({ id, result });
  } catch (err: any) {
    console.error(err);
    postMessage({ id, result : err.message });
  }
});


// Import the Emscripten-generated script
console.log('Importing Emscripten module...');
importScripts('./assets/stackrabbit/wasmRabbit.js');

// Load the Emscripten module and store it in the API variable
Module().then((wasm: any) => {
  API = wasm;
  postMessage("INIT"); // Notify the main thread of worker initialization
});

