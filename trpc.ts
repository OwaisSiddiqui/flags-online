import { initTRPC, TRPCError } from "@trpc/server";
import { inferAsyncReturnType } from "@trpc/server";
import { authenticateToken, getEnv } from "./utils";
import { RequestContext } from "@mikro-orm/core";
import { User } from "./entities";
import { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { JwtPayload } from "jsonwebtoken";
import { isCustomError } from "./errors";
import { DI } from "./db";

export const createContext = async (
  opts: CreateExpressContextOptions | CreateWSSContextFnOptions
) => {
  const getUserIdFromHeader = async () => {
    try {
      const req = opts.req;
      const urlSearchParamsToken = new URL(
        `http://${getEnv("DEV_HOST")}:4000${req.url}`
      ).searchParams.get("token");
      const token =
        req.headers.authorization?.split(" ")[1] || urlSearchParamsToken;
      if (!token) {
        throw new Error("Token is empty");
      }
      const userId = (authenticateToken(token) as JwtPayload).userId;
      return userId;
    } catch (error) {
      return null;
    }
  };
  const userId = await getUserIdFromHeader();
  let user: null | User = null;
  if (typeof userId === "string") {
    user = await DI.userRepositroy.findOne(
      {
        id: userId,
      },
      {
        populate: ["id"],
      }
    );
  }

  return {
    userId: user?.id,
    req: opts.req,
    res: opts.res,
    DI: DI
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        ...isCustomError(error.cause) ? error.cause.serialize() : {}
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const protectedProcedure = publicProcedure.use(isAuthed);
