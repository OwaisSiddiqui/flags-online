import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User, Room } from "./entities";
import { Flag } from "./entities/Flag";
import { Game } from "./entities/Game";
import { Question } from "./entities/Question";
import { getEnv, isProduction } from "./utils";

let options = {
  entities: [User, Room, Flag, Question, Game],
  type: "postgresql"
} as Options<PostgreSqlDriver>

if (isProduction()) {
  options = {
    ...options,
    dbName: getEnv("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_DB_NAME"),
    host: getEnv("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_HOSTNAME"),
    port: parseInt(getEnv("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT")),
    user: getEnv("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_USERNAME"),
    password: getEnv("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PASSWORD")
  }
} else {
  options = {...options, dbName: getEnv("PGDATABASE"),}
}

export default options
