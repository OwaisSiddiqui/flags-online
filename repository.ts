import { EntityRepository } from "@mikro-orm/core";
import { DI } from "./database";
import { Game, Room, Question, Flag } from "./entities";
import { shuffleArray } from "./utils";

export class CustomGameRepository extends EntityRepository<Game> {
  public async createGameWithQuestions(room: Room) {
    const game = DI.gameRepository.create({
      room: room,
      questions: [],
      questionIndex: 0,
      hostScore: 0,
      opponentScore: 0,
      hostPenalty: 0,
      opponentPenalty: 0,
    });
    const flags = await DI.flagRepository.findAll();
    shuffleArray(flags);
    for (let i = 0; i < 15; i++) {
      await DI.questionRepository.createQuestionWithOptions(game, flags[i], i);
    }
    return game;
  }
}

export class CustomQuestionRepository extends EntityRepository<Question> {
  public async createQuestionWithOptions(
    game: Game,
    answer: Flag,
    index: number
  ) {
    const question = DI.questionRepository.create({
      game: game,
      options: [],
      index: index,
      flag: answer,
    });

    const flags = await DI.flagRepository.findAll();
    const options = [answer];
    while (options.length < 4) {
      shuffleArray(flags);
      const randomFlag = flags[0];
      options.push(randomFlag);
      flags.shift();
    }
    shuffleArray(options);
    question.options = options;
    await DI.questionRepository.persistAndFlush(question);
  }
}
