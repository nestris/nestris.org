# nestris.org

## Set up environment

### Define .env.production
```
NODE_ENV=production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=mydatabase
```

### Define .env.development
```
NODE_ENV=development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=mydatabase
```


## Run Docker


# Every time you modify /shared, copy shared folder to client and server directories through
`./update-shared.sh`

### Run docker containers
`docker compose up --build`

### Clean docker containers
`docker compose down`

### To switch to production mode
`cp .env.production .env`

### To switch to development mode
`cp .env.development .env`