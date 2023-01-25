import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import { Flag } from "../entities";

export class FlagsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const codesCountry = await fetch("https://flagcdn.com/en/codes.json").then(
      (response) => response.json()
    );
    const codes = Object.keys(codesCountry);
    const flags: Flag[] = [];
    const currentCountries: { [key: string]: number } = {};
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (!code.includes("-")) {
        if (!(codesCountry[code] in currentCountries)) {
          currentCountries[codesCountry[code]] = 0;
          flags.push(
            new Flag(
              codesCountry[code],
              `https://flagcdn.com/w1280/${code}.png`
            )
          );
        }
        currentCountries[codesCountry[code]] += 1;
      }
    }
    em.persistAndFlush(flags);
  }
}
