# first, make directory client/src/assets/stackrabbit if it doesn't exist
mkdir -p client/src/assets/stackrabbit

# Then, run the following command to generate the wasm file
emcc -O3 StackRabbit/src/cpp_modules/src/wasm.cpp --bind -lembind -g0 \
    --pre-js StackRabbit/src/cpp_modules/locateFile.js \
    -s MODULARIZE=1 -s EXPORT_NAME="Module" \
    -o client/src/assets/stackrabbit/wasmRabbit.js

echo "Generated wasmRabbit.js into client/src/assets/stackrabbit"