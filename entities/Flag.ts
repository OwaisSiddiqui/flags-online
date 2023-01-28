import {
  Entity,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { v4 } from "uuid";

@Entity()
export class Flag {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @Property()
  country: string;

  @Property()
  url: string;

  constructor(flag: string, url: string) {
    this.country = flag;
    this.url = url;
  }
}
