import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Game } from "./Game";
import { v4 } from "uuid";
import { Flag } from "./Flag";
import { CustomQuestionRepository } from "../repository";

@Entity({ customRepository: () => CustomQuestionRepository })
export class Question {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @Property()
  index: number;

  @ManyToMany({ nullable: true, entity: () => Game })
  game?: Game;

  @ManyToOne()
  flag: Flag;

  @ManyToMany(() => Flag)
  options: Flag[];

  constructor(index: number, flag: Flag) {
    this.index = index;
    this.flag = flag;
    this.options = [];
  }
}
