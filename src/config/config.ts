import {config as conf} from "dotenv"

conf();

const _config = {
    port:process.env.PORT,
    databaseUrl:process.env.DB_CONNECTION_STRING,
    env:process.env.ENV,
    jwtSecret:process.env.JWT_SECRET,
    clientUrl:process.env.CLIENT_URL
}

export const config = Object.freeze(_config);