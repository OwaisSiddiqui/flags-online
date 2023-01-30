import { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { FlagsSeeder } from "./FlagsSeeder";

export class DbSeeder extends Seeder {
  run(em: EntityManager): Promise<void> {
    return this.call(em, [FlagsSeeder]);
  }
}
