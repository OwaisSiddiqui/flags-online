import {
  Entity,
  ManyToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Question } from "./Question";
import { Room } from "./Room";
import { v4 } from "uuid";
import { CustomGameRepository } from "../repository";

@Entity({ customRepository: () => CustomGameRepository })
export class Game {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @OneToOne(() => Room, (room) => room.game)
  room: Room;

  @ManyToMany(() => Question, (question) => question.game)
  questions: Question[];

  @Property()
  questionIndex: number;

  @Property()
  hostScore: number;

  @Property()
  opponentScore: number;

  @Property()
  hostPenalty: number;

  @Property()
  opponentPenalty: number;

  @Property({ nullable: true })
  winner?: string;

  constructor(room: Room) {
    this.room = room;
    this.questions = [];
    this.questionIndex = 0;
    this.hostScore = 0;
    this.opponentScore = 0;
    this.hostPenalty = 0;
    this.opponentPenalty = 0;
  }
}
