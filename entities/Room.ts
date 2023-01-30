import {
  Entity,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { v4 } from "uuid";
import { Game } from "./Game";
import { User } from "./User";

@Entity()
export class Room {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @Property()
  name: string;

  @OneToOne()
  host: User;

  @OneToOne({ nullable: true })
  opponent?: User;

  @OneToMany(() => User, (user) => user.room)
  guests: User[];

  @OneToOne({ nullable: true })
  game?: Game;

  constructor(name: string, host: User) {
    this.name = name;
    this.guests = [];
    this.host = host;
  }
}
