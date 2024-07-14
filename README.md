# nestris.org

# Set up development environment
If you're interested in developing, testing, or running nestris.org locally, this is the right place.

### Install npm and Docker

### Define .env file for development
```
NODE_ENV=production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=mydatabase
```

## Every time you modify /shared, run this command
`./update-shared.sh`

## To run client (Angular) unit tests
`cd client; npm test; cd ..`

## To run server (Jest) unit tests
`cd server; npm test; cd ..`

## Running the Application

### Run docker containers
`docker compose -f docker-compose.dev.yml up --build`

### Clean docker containers
`docker compose down`


## Set up production environment for CI/CD
The current set up uses Github Actions and DigitalOcean. This section should be irrelevant to you unless you are interested in hosting your own production deployment server.

### Define secrets for Github Actions in repository
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=mydatabase
```