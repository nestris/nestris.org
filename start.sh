#!/bin/bash

./update-shared.sh

./generate-wasm.sh

# Execute Docker Compose for local dev environment
docker compose -f docker-compose.dev.yml up --build
