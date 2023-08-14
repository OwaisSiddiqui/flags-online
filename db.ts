import type { PostgreSqlDriver } from "@mikro-orm/postgresql";
import {
  Connection,
  EntityManager,
  EntityRepository,
  IDatabaseDriver,
  MikroORM,
} from "@mikro-orm/core";
import { Room, User, Flag, Question, Game } from "./entities";
import { CustomGameRepository, CustomQuestionRepository } from "./repository";
import MikroORMOptions from "./mikro-orm.config";

export type DIType = {
  orm: MikroORM;
  em: EntityManager;
  userRepositroy: EntityRepository<User>;
  roomRepository: EntityRepository<Room>;
  flagRepository: EntityRepository<Flag>;
  questionRepository: CustomQuestionRepository;
  gameRepository: CustomGameRepository;
};

export const DI = {} as DIType;

export const initDI = async () => {
  DI.orm = await MikroORM.init<PostgreSqlDriver>(MikroORMOptions);

  const fork = DI.orm.em.fork()

  DI.em = fork;

  const em = DI.em;

  DI.userRepositroy = em.getRepository(User);
  DI.roomRepository = em.getRepository(Room);
  DI.flagRepository = em.getRepository(Flag);
  DI.questionRepository = em.getRepository(Question);
  DI.gameRepository = em.getRepository(Game);
};