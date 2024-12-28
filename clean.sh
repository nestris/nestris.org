# Clean up all dev docker containers
docker compose -f docker-compose.dev.server.yml down
docker compose -f docker-compose.dev.cpp.yml down
docker compose -f docker-compose.dev.yml down