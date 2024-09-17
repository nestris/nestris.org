#!/bin/bash

# Execute Docker Compose for the staging environment
docker compose -f docker-compose.staging.yml up --build
