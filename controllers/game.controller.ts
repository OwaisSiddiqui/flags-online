import { DI } from "../db";
import { Game, User } from "../entities";
import { FlagSchema, QuestionSchema } from "../schemas";
import { protectedProcedure, router } from "../trpc";
import { sleep } from "../utils";
import * as errors from "../errors";
import { pusher } from "../pusher";

const clearGame = (user: User) => {
  const room = user.room;
  if (room) {
    room.game = undefined;
  }
};

const countdownPenalty = async (game: Game, userId: string) => {
  for (let i = 3; i >= 0; i--) {
    if (game.room.host.id === userId) {
      game.hostPenalty = i;
    } else if (game.room.opponent?.id === userId) {
      game.opponentPenalty = i;
    }
    await DI.gameRepository.persistAndFlush(game);
    await pusher.trigger(`private-penalty-userId${userId}`, "refetch", null);
    await sleep(1000);
  }
};

export const gameRouter = router({
  getGame: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["room.game.id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    const gameId = user.room?.game?.id;
    if (!gameId) {
      throw errors.GAME_NOT_FOUND;
    }
    return {
      id: gameId,
    };
  }),
  createGame: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["type", "room.id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    if (!(user.type === "host")) {
      throw errors.USER_NOT_HOST;
    }
    const roomId = user.room?.id;
    if (!roomId) {
      throw errors.USER_HAS_NO_ROOM;
    }
    const room = await DI.roomRepository.findOne({
      id: roomId,
    });
    if (!room) {
      throw errors.ROOM_NOT_FOUND;
    }
    const game = await DI.gameRepository.createGameWithQuestions(room);
    await DI.gameRepository.persistAndFlush(game);
    await pusher.trigger(`private-game-roomId${roomId}`, "refetch", {
      game: {
        id: game.id,
      },
    });
  }),
  getPenalty: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["room.game.id", "id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    const game = await DI.gameRepository.findOne(
      {
        id: user.room?.game?.id,
      },
      {
        populate: [
          "room.host.id",
          "room.opponent.id",
          "opponentPenalty",
          "hostPenalty",
        ],
      }
    );
    if (!game) {
      throw errors.GAME_NOT_FOUND;
    }
      await DI.em.populate(game, ["hostPenalty", "opponentPenalty"]);
      if (game.room.host.id === userId) {
        return game.hostPenalty;
      } else if (game.room.opponent?.id === userId) {
        return game.opponentPenalty;
      } else {
        throw errors.USER_NOT_HOST_OR_OPPONENT;
      }
  }),
  handleAnswer: protectedProcedure
    .input(QuestionSchema.merge(FlagSchema))
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const user = await DI.userRepositroy.findOne(
        {
          id: userId,
        },
        {
          populate: ["room.game.id", "id"],
        }
      );
      if (!user) {
        throw errors.USER_NOT_FOUND;
      }
      const question = await DI.questionRepository.findOne(
        {
          id: input.questionId,
        },
        {
          populate: ["flag.country"],
        }
      );
      if (!question) {
        throw errors.QUESTION_NOT_FOUND;
      }
      const game = await DI.gameRepository.findOne(
        {
          id: user.room?.game?.id,
        },
        {
          populate: [
            "room.opponent.id",
            "hostPenalty",
            "opponentPenalty",
            "room.host.id",
            "hostScore",
            "opponentScore",
            "room.host.username",
            "questionIndex",
            "questions.id",
            "id",
          ],
        }
      );
      if (!game) {
        throw errors.GAME_NOT_FOUND;
      }
      let penalty;
      if (game.room.host.id === userId) {
        penalty = game.hostPenalty;
      } else if (game.room.opponent?.id === userId) {
        penalty = game.opponentPenalty;
      } else {
        throw errors.USER_NOT_HOST_OR_OPPONENT;
      }
      if (question.flag.country === input.flagName && penalty === 0) {
        if (game.room.host.id === userId) {
          game.hostScore += 1;
        } else if (game.room.opponent?.id === userId) {
          game.opponentScore += 1;
        } else {
          throw errors.USER_NOT_HOST_OR_OPPONENT;
        }
        if (game.questionIndex + 1 < game.questions.length) {
          game.questionIndex += 1;
        } else {
          let winner;
          await DI.em.populate(game, [
            "room.opponent",
            "room.host",
            "room.guests",
          ]);
          if (game.hostScore > game.opponentScore) {
            winner = game.room.host.username;
          } else if (game.hostScore < game.opponentScore) {
            winner = game.room.opponent?.username;
          } else {
            winner = "tie";
          }
          game.winner = winner;
          const room = await DI.roomRepository.findOne(
            {
              id: game.room.id,
            },
            { populate: ["guests"] }
          );
          const gameHostUser = await DI.userRepositroy.findOne({
            id: game.room.host.id,
          });
          const gameOpponentUser = await DI.userRepositroy.findOne({
            id: game.room.opponent?.id,
          });
          if (room && gameHostUser && gameOpponentUser) {
            clearGame(gameHostUser);
            clearGame(gameOpponentUser);
            for (const guest of room.guests) {
              clearGame(guest);
            }
          }
          await DI.gameRepository.persistAndFlush(game);
          await pusher.trigger(`private-endGame-gameId${game.id}`, "refetch", winner);
          return;
        }
        await DI.gameRepository.persistAndFlush(game);
        await pusher.trigger(
          `private-currentQuestion-gameId${game.id}`,
          "refetch",
          null
        );
        return;
      } else if (penalty === 0) {
        await DI.gameRepository.persistAndFlush(game);
        if (game.room.host.id === userId) {
          await countdownPenalty(game, userId);
        } else if (game.room.opponent?.id === userId) {
          await countdownPenalty(game, userId);
        } else {
          throw errors.USER_NOT_HOST_OR_OPPONENT;
        }
        return true;
      } else {
        throw errors.PENALTY_IS_NOT_ZERO
      }
    }),
  currentQuestion: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["room.game.id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    const game = await DI.gameRepository.findOne(
      {
        id: user.room?.game?.id,
      },
      {
        populate: ["questions"],
      }
    );
    if (!game) {
      throw errors.GAME_NOT_FOUND;
    }
      const question = game.questions[game.questionIndex];
      await DI.em.populate(question, ["flag.url", "id", "options"]);
      const options = [];
      for (const option of question.options) {
        options.push({
          id: option.id,
          country: option.country,
        });
      }
      return {
        id: question.id,
        flag: {
          url: question.flag.url,
        },
        options: options,
      };
  }),
});
