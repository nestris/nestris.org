//  emcc src/cpp_modules/src/wasm.cpp -o wasm-stackrabbit.js -sMODULARIZE -sEXPORTED_RUNTIME_METHODS=ccall -s ENVIRONMENT='web'
declare var Module: any;
let isModuleLoaded = false;

Module.onRuntimeInitialized = () => {
    isModuleLoaded = true;
    console.log("Module loaded");
}


// This is an async function to handle loading the WebAssembly module
export async function testWASM() {
    try {
        console.log("Loading WASM module");
        const response = Module['__Z11getTopMovesNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE'](
            "00000000000000000000000000000000000000000000000000000000000000011000000001100100000110110000011111000011111100011111110001111111001111111100111111111011111111101111111110111111111011111111101111111110|19|192|2|0|X.|200|6|"
        );

        console.log("Response:", response);

    } catch (e) {
        // Handle errors that may occur
        console.error("Error loading WASM:", e);
    }
}
