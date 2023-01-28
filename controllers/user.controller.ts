import { LoginSchema, PusherUserAuthSchema, SignupSchema, UserExistsSchema } from "../schemas";
import { DI } from "../db";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils";
import { observable } from "@trpc/server/observable";
import * as errors from "../errors"
import { pusher } from "../pusher";
import { TRPCError } from "@trpc/server";

const saltRounds = 10;

export const userRouter = router({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne({
      id: userId
    }, {
      populate: ['id', 'username', 'type', 'room.id', 'room.game.id']
    })
    if (user) {
      return {
        id: user.id,
        username: user.username,
        type: user.type,
        room: {
          id: user.room?.id,
          game: {
            id: user.room?.game?.id
          }
        }
      }
    } else {
      throw errors.USERNAME_NOT_FOUND
    }
  }),
  signup: publicProcedure
    .input(SignupSchema)
    .mutation(async ({ input, ctx }) => {
      const isUserExist = await DI.userRepositroy.findOne({
        username: input.username,
      });
      if (!isUserExist) {
        const password = input.password;
        const repeatPassword = input.repeatPassword;
        if (!(password === repeatPassword)) {
          throw errors.PASSWORD_AND_REPEAT_PASSWORD_NOT_SAME
        }
        const hash = await bcrypt.hash(password, saltRounds);
        const user = DI.userRepositroy.create({
          username: input.username,
          type: "default",
          password: hash,
        });
        await DI.userRepositroy.populate(user, ['id'])
        await DI.userRepositroy.persistAndFlush(user);
        ctx.userId = user.id;
        return generateAccessToken(user.id);
      } else {
        throw errors.USERNAME_ALREADY_EXISTS
      }
    }),
  login: publicProcedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
    const user = await DI.userRepositroy.findOne({
      username: input.username,
    });
    if (user) {
      const isCorrectPassword = await bcrypt.compare(
        input.password,
        user.password
      );
      if (isCorrectPassword) {
        ctx.userId = user.id;
        return generateAccessToken(user.id);
      } else {
        throw errors.INCORRECT_PASSWORD
      }
    } else {
      throw errors.USERNAME_NOT_FOUND
    }
  }),
  isUserExist: publicProcedure.input(UserExistsSchema).mutation(async ({ input }) => {
    return !!(await DI.userRepositroy.findOne({
      username: input.username
    }))
  }),
  randomNumber: publicProcedure.subscription(() => {
    return observable<{ randomNumber: number }>((emit) => {
      const timer = setInterval(() => {
        emit.next({ randomNumber: Math.random() });
      }, 1000);
      return () => {
        clearInterval(timer);
      };
    });
  }),
  pusherUserAuth: protectedProcedure.input(PusherUserAuthSchema).mutation(({ input, ctx }) => {
    console.log('Pusher user auth input', input)
    const { userId } = ctx
    const { socketId, channelName } = input
    const userIdFromChannelName = channelName.slice(channelName.indexOf('userId') + 6)
    if (!userId) {
      throw errors.USERNAME_NOT_FOUND
    }
    console.log(input, userId, socketId, channelName, userIdFromChannelName)
    if (userId !== userIdFromChannelName) {
      throw new TRPCError({
        code: "UNAUTHORIZED"
      })
    }
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return authResponse
  })
});
