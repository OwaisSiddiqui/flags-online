import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User, Room } from "./entities";
import { Flag } from "./entities/Flag";
import { Game } from "./entities/Game";
import { Question } from "./entities/Question";
import { ENVNotDefined } from "./errors";
import { isProduction } from "./utils";

const PGDATABASE = process.env.PGDATABASE;
if (!PGDATABASE) {
  throw new Error("PGDATABASE environment variable not defined");
}

let options = {
  entities: [User, Room, Flag, Question, Game],
  type: "postgresql"
} as Options<PostgreSqlDriver>

if (isProduction()) {
  const AWS_RDS_FLAGS_ONLINE_POSTGRESQL_HOSTNAME = process.env.AWS_RDS_FLAGS_ONLINE_POSTGRESQL_HOSTNAME
  const AWS_RDS_FLAGS_ONLINE_POSTGRESQL_DB_NAME = process.env.AWS_RDS_FLAGS_ONLINE_POSTGRESQL_DB_NAME
  const AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT = process.env.AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT
  const AWS_RDS_FLAGS_ONLINE_POSTGRESQL_USERNAME = process.env.AWS_RDS_FLAGS_ONLINE_POSTGRESQL_USERNAME
  const AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PASSWORD = process.env.AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PASSWORD
  if (!AWS_RDS_FLAGS_ONLINE_POSTGRESQL_HOSTNAME) {
    throw new ENVNotDefined("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_HOSTNAME")
  }
  if (!AWS_RDS_FLAGS_ONLINE_POSTGRESQL_DB_NAME) {
    throw new ENVNotDefined("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_DB_NAME")
  }
  if (!AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT) {
    throw new ENVNotDefined("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT")
  }
  if (!AWS_RDS_FLAGS_ONLINE_POSTGRESQL_USERNAME) {
    throw new ENVNotDefined("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_USERNAME")
  }
  if (!AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PASSWORD) {
    throw new ENVNotDefined("AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PASSWORD")
  }
  const AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT_NUMBER = parseInt(AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT)
  options = {
    ...options,
    dbName: AWS_RDS_FLAGS_ONLINE_POSTGRESQL_DB_NAME,
    host: AWS_RDS_FLAGS_ONLINE_POSTGRESQL_HOSTNAME,
    port: AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PORT_NUMBER,
    user: AWS_RDS_FLAGS_ONLINE_POSTGRESQL_USERNAME,
    password: AWS_RDS_FLAGS_ONLINE_POSTGRESQL_PASSWORD
  }
} else {
  options = {...options, dbName: PGDATABASE,}
}

export default options
