/// <reference lib="webworker" />

declare const Module: any;
var API: any;

addEventListener('message', (event: MessageEvent<{id: number, endpoint: string, parameters: string}>) => {

  const { id, endpoint, parameters } = event.data;

  try {
    // Ensure the endpoint corresponds to a valid function in the Module
    if (typeof API[endpoint] !== 'function') {
      throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    // Call the function dynamically and parse the JSON response
    const rawRes = API[endpoint](parameters);
    const result = JSON.parse(rawRes);

    // Send the result back to the main thread
    postMessage({ id, result });
  } catch (err: any) {
    console.error(err);
    postMessage({ error: err.message });
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

