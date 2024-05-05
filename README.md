
# Flags-Online.com

Flags Online is an online multiplayer game where players compete in 1v1 matches to guess world flags.
## Features
- Accounts (user sign up w/ username/password, login)
- Room creation (w/ one host vs one opponent, and unlimited guests)
- Realtime 1v1 (instant answer feedback, updated to opponent, host, and guests)
- Penalty for wrong answer (3 second timer)
## Technologies

Everything was written in TypeScript.

#### Frontend:
- React (w/ Vite)
Other:
- React Router (for routing)
- React Hook Form (for building robust forms)
- PusherJS (frontend handle Pusher)

#### Backend:
- Express.js 
Other:
- Mikro ORM (database ORM with Postgres)
- tRPC (for typesafe APIs)
- Pusher (hosted service for WebSockets)
- Zod (for data validation)
- jsonwebtoken (for user auth with JSON Web Tokens [JWT])
#### Deploy
- Vercel (CDN)
- Supabase (hosted Postgres database)
- Pusher (hosted WebSockets)
## Installation
First clone this repository and cd into the folder in your terminal. Then install the node modules by running:
```
npm install
```
Now you should setup the environment variables. This can be done by copying the template of environment variables needed from the `.env.example` file and paste it into a newly created file in the root folder called `.env`. 
```.env
# .env

# e.g. 3000
PORT=""

# e.g. postgres://postgres:admin@localhost:5432/flags (Windows)
PG_DEV_CONNECTION_URI=""

SUPABASE_FLAGS_ONLINE_POSTGRESQL_HOSTNAME=""
SUPABASE_FLAGS_ONLINE_POSTGRESQL_PORT=""
SUPABASE_FLAGS_ONLINE_POSTGRESQL_DB_NAME=""
SUPABASE_FLAGS_ONLINE_POSTGRESQL_USERNAME=""
SUPABASE_FLAGS_ONLINE_POSTGRESQL_PASSWORD=""

PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""

# openssl rand -base64 64
TOKEN_SECRET=""

# 'development' or 'production'
APP_ENV=""

# e.g. localhost
DEV_HOST=""
# e.g. 3000
DEV_PORT=""

# e.g. 10
SALT_ROUNDS=""
```
If you want to deploy the project, you need to create an account for Supabase and Pusher and create projects in both to get the keys.
- Supabase: https://supabase.com/
- Pusher: https://pusher.com/

After you fill in the necessary variables, you can run the project using:
```
npm run dev
```
