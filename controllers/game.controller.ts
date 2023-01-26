import { DI } from "../db";
import { Game, User } from "../entities";
import { FlagSchema, QuestionSchema } from "../schemas";
import { protectedProcedure, router } from "../trpc";
import { getUser, sleep } from "../utils";
import * as errors from "../errors"
import { pusher } from "../pusher";
import { TRPCError } from "@trpc/server";

const PENALTY_TIME = 3;

const clearGame = (user: User) => {
  const room = user.room
  if (room) {
    room.game = undefined
  }
}

const countdownPenalty = async (game: Game, user: User) => {
  if (game.room.host.id === user.id) {
    game.hostPenalty = PENALTY_TIME;
  } else if (game.room.opponent?.id === user.id) {
    game.opponentPenalty = PENALTY_TIME;
  } else {
    throw errors.USER_NOT_HOST_OR_OPPONENT
  }
  await DI.gameRepository.persistAndFlush(game);
  pusher.trigger("penalty", "refetch", null)
  for (let i = PENALTY_TIME; i > 0; i--) {
    await sleep(1000);
    if (game.room.host.id === user.id) {
      game.hostPenalty -= 1;
    } else if (game.room.opponent?.id === user.id) {
      game.opponentPenalty -= 1;
    }
    await DI.gameRepository.persistAndFlush(game);
    pusher.trigger("penalty", "refetch", null)
  }
  pusher.trigger("penalty", "refetch", null)
};

export const gameRouter = router({
  createGame: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne({
      id: userId
    }, {
      populate: ['type', 'room.id']
    })
    if (!user) {
      throw errors.USER_NOT_FOUND
    }
    if (user.type === "host") {
      const roomId = user.room?.id;
      if (roomId) {
        const room = await DI.roomRepository.findOne({
          id: roomId
        })
        if (!room) {
          throw errors.ROOM_NOT_FOUND
        }
        const game = await DI.gameRepository.createGameWithQuestions(room);
        await DI.gameRepository.persistAndFlush(game);
        pusher.trigger("game", "refetch", null)
      } else {
        throw errors.USER_HAS_NO_ROOM
      }
    } else {
      throw errors.USER_NOT_HOST
    }
  }),
  getPenalty: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne({
      id: userId
    }, {
      populate: ['room.game.id', 'id']
    })
    if (!user) {
      throw errors.USER_NOT_FOUND
    }
    const game = await DI.gameRepository.findOne({
      id: user.room?.game?.id
    }, {
      populate: ['room.host.id', 'room.opponent.id', 'opponentPenalty', 'hostPenalty']
    })
    if (game) {
      await DI.em.populate(game, ["hostPenalty", "opponentPenalty"]);
      if (game.room.host.id === user.id) {
        return game.hostPenalty;
      } else if (game.room.opponent?.id === user.id) {
        return game.opponentPenalty;
      } else {
        throw errors.USER_NOT_HOST_OR_OPPONENT
      }
    } else {
      throw errors.GAME_NOT_FOUND
    }
  }),
  handleAnswer: protectedProcedure
    .input(QuestionSchema.merge(FlagSchema))
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const user = await DI.userRepositroy.findOne({
        id: userId
      }, {
        populate: ['room.game.id', 'id']
      })
      if (!user) {
        throw errors.USER_NOT_FOUND
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
        throw errors.QUESTION_NOT_FOUND
      }
      const game = await DI.gameRepository.findOne({
        id: user.room?.game?.id,
      }, {
        populate: ['room.opponent.id', 'hostPenalty', 'opponentPenalty', 'room.host.id', 'hostScore','opponentScore', 'room.host.username', 'questionIndex', 'questions.id']
      });
      if (!game) {
        throw errors.GAME_NOT_FOUND
      }
      let penalty;
      if (game.room.host.id === user.id) {
        penalty = game.hostPenalty;
      } else if (game.room.opponent?.id === user.id) {
        penalty = game.opponentPenalty;
      } else {
        throw errors.USER_NOT_HOST_OR_OPPONENT
      }
      let isAnswer = false;
      isAnswer = question.flag.country === input.flagName;
      if (isAnswer && penalty === 0) {
        if (game.room.host.id === user.id) {
          game.hostScore += 1;
        } else if (game.room.opponent?.id === user.id) {
          game.opponentScore += 1;
        } else {
          throw errors.USER_NOT_HOST_OR_OPPONENT
        }
        if (game.questionIndex + 1 < game.questions.length) {
          game.questionIndex += 1;
        } else {
          let winner;
          await DI.em.populate(game, ["room.opponent", "room.host", "room.guests"]);
          if (game.hostScore > game.opponentScore) {
            winner = game.room.host.username;
          } else if (game.hostScore < game.opponentScore) {
            winner = game.room.opponent?.username;
          } else {
            winner = "tie";
          }
          game.winner = winner;
          const room = await DI.roomRepository.findOne({
            id: game.room.id
          }, {populate: ['guests']})
          const gameHostUser = await DI.userRepositroy.findOne({
            id: game.room.host.id
          })
          const gameOpponentUser = await DI.userRepositroy.findOne({
            id: game.room.opponent?.id
          })
          if (room && gameHostUser && gameOpponentUser) {
            clearGame(gameHostUser)
            clearGame(gameOpponentUser)
            for (const guest of room.guests) {
              clearGame(guest)
            }
          }
          await DI.gameRepository.persistAndFlush(game);
          pusher.trigger("endGame", "refetch", winner)
          return;
        }
        await DI.gameRepository.persistAndFlush(game);
        pusher.trigger("currentQuestion", "refetch", null)
      } else if (penalty === 0) {
        await DI.gameRepository.persistAndFlush(game);
        if (game.room.host.id === user.id) {
          await countdownPenalty(game, user);
        } else if (game.room.opponent?.id === user.id) {
          await countdownPenalty(game, user);
        } else {
          throw errors.USER_NOT_HOST_OR_OPPONENT
        }
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something's not right..."
        })
      }
    }),
  currentQuestion: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne({
      id: userId
    }, {
      populate: ['room.game.id']
    })
    if (!user) {
      throw errors.USER_NOT_FOUND
    }
    const game = await DI.gameRepository.findOne({
      id: user.room?.game?.id
    }, {
      populate: ["questions"]
    });
    if (game) {
      const question = game.questions[game.questionIndex];
      await DI.em.populate(question, ["flag.url", "id", "options"]);
      const options = []
      for (const option of question.options) {
        options.push({
          id: option.id,
          country: option.country
        })
      }
      return {
        id: question.id,
        flag: {
          url: question.flag.url,
        },
        options: options,
      };
    } else {
      throw errors.GAME_NOT_FOUND
    }
  }),
});
