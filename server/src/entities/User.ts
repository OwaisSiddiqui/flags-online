import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from "uuid";
import { Room } from "./Room";

type UserType = "host" | "opponent" | "guest" | "default";

@Entity({
  tableName: "users",
})
export class User {
  @PrimaryKey({ type: "uuid" })
  id: string = v4();

  @Property({ length: 20, unique: true })
  username: string;

  @Property()
  password: string;

  @Property({ nullable: false })
  type: UserType;

  @ManyToOne(() => Room, { nullable: true })
  room?: Room;

  setRoom(room: Room) {
    if (this.room) {
      throw new Error("User is already in a room");
    }
    this.room = room;
  }

  constructor(username: string, password: string) {
    this.username = username;
    this.type = "default";
    this.password = password;
  }
}
