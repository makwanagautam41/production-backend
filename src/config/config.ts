import {config as conf} from "dotenv"

conf();

const _config = {
    port:process.env.PORT,
    databaseUrl:process.env.DB_CONNECTION_STRING,
    env:process.env.ENV
}

export const config = Object.freeze(_config);