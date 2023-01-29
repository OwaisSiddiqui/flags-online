import { Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { User, Room } from "./entities";
import { Flag } from "./entities/Flag";
import { Game } from "./entities/Game";
import { Question } from "./entities/Question";
import { getEnv, isProd } from "./utils";

let options = {
  entities: [User, Room, Flag, Question, Game],
  type: "postgresql",
  seeder: {
    defaultSeeder: "DbSeeder",
  },
} as Options<PostgreSqlDriver>;

if (isProd()) {
  options = {
    ...options,
    dbName: getEnv("SUPABASE_FLAGS_ONLINE_POSTGRESQL_DB_NAME"),
    host: getEnv("SUPABASE_FLAGS_ONLINE_POSTGRESQL_HOSTNAME"),
    port: parseInt(getEnv("SUPABASE_FLAGS_ONLINE_POSTGRESQL_PORT")),
    user: getEnv("SUPABASE_FLAGS_ONLINE_POSTGRESQL_USERNAME"),
    password: getEnv("SUPABASE_FLAGS_ONLINE_POSTGRESQL_PASSWORD"),
  };
} else {
  options = { ...options, dbName: getEnv("PGDB") };
}

export default options;
