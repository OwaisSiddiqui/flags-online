import {
  LoginSchema,
  PusherUserAuthSchema,
  SignupSchema,
  UserExistsSchema
} from "../schemas";
import { DI } from "../db";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import bcrypt from "bcrypt";
import { generateAccessToken, getEnv } from "../utils";
import * as errors from "../errors";
import { pusher } from "../pusher";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;
    const user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["id", "username", "type", "room.id", "room.game.id"],
      }
    );
    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
      return {
        id: user.id,
        username: user.username,
        type: user.type,
        room: {
          id: user.room?.id,
          game: {
            id: user.room?.game?.id,
          },
        },
      };
  }),
  isUserExist: publicProcedure
    .input(UserExistsSchema)
    .mutation(async ({ input }) => {
      return !!(await DI.userRepositroy.findOne({
        username: input.username,
      }));
    }),
  signup: publicProcedure
    .input(SignupSchema)
    .mutation(async ({ input, ctx }) => {
      const isUserExist = await DI.userRepositroy.findOne({
        username: input.username,
      });
      if (isUserExist) {
        throw errors.USERNAME_ALREADY_EXISTS;
      }
        const password = input.password;
        const repeatPassword = input.repeatPassword;
        if (!(password === repeatPassword)) {
          throw errors.PASSWORD_AND_REPEAT_PASSWORD_NOT_SAME;
        }
        const hash = await bcrypt.hash(password, parseInt(getEnv("SALT_ROUNDS")));
        const user = DI.userRepositroy.create({
          username: input.username,
          type: "default",
          password: hash,
        });
        await DI.userRepositroy.populate(user, ["id"]);
        await DI.userRepositroy.persistAndFlush(user);
        ctx.userId = user.id;
        return generateAccessToken(user.id);
    }),
  login: publicProcedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
    const user = await DI.userRepositroy.findOne({
      username: input.username,
    });
    if (!user) {
      throw errors.USERNAME_NOT_FOUND;
    }
      const isCorrectPassword = await bcrypt.compare(
        input.password,
        user.password
      );
      if (!isCorrectPassword) {
        throw errors.INCORRECT_PASSWORD;
      }
        ctx.userId = user.id;
        return generateAccessToken(user.id);
  }),
  pusherUserAuth: protectedProcedure
    .input(PusherUserAuthSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId } = ctx;
      const user = await DI.userRepositroy.findOne(
        {
          id: userId,
        },
        {
          populate: ["id", "room.id", "room.game.id"],
        }
      );
      const { socketId, channelName } = input;
      if (channelName.includes("userId")) {
        const userIdFromChannelName = channelName.slice(
          channelName.indexOf("userId") + 6
        );
        if (userId !== userIdFromChannelName) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
          });
        }
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        return authResponse;
      } else if (channelName.includes("roomId")) {
        const roomIdFromChannelName = channelName.slice(
          channelName.indexOf("roomId") + 6
        );
        if (user?.room?.id !== roomIdFromChannelName) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
          });
        }
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        return authResponse;
      } else if (channelName.includes("gameId")) {
        const gameIdFromChannelName = channelName.slice(
          channelName.indexOf("gameId") + 6
        );
        if (user?.room?.game?.id !== gameIdFromChannelName) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
          });
        }
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        return authResponse;
      } else {
        const authResponse = pusher.authorizeChannel(socketId, channelName);
        return authResponse;
      }
    }),
});
