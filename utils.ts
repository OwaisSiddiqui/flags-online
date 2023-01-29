import jwt from "jsonwebtoken";
import crypto from "crypto";
import { DI } from "./db";
import * as errors from "./errors";

export const getEnv = (name: string) => {
  const env = process.env[name];
  if (!env) {
    throw new Error(`${name} env is not defined`);
  }
  return env;
};

export function shuffleArray(array: unknown[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export const getTokenSecret = () => {
  const tokenSecret = getEnv("TOKEN_SECRET");
  return tokenSecret;
};

export const generateAccessToken = (userId: string) => {
  const tokenSecret = getTokenSecret();
  return jwt.sign({ userId: userId }, tokenSecret, { expiresIn: "10d" });
};

export const authenticateToken = (token: string) => {
  if (!token) {
    throw new Error("Token cannot be an empty string");
  }
  const tokenSecret = getTokenSecret();
  return jwt.verify(token, tokenSecret);
};

export const generateTokenSecret = () => {
  console.log(crypto.randomBytes(64).toString("hex"));
};

export const sleep = (waitTimeInMs: number) =>
  new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

export const getUser = async (data: { id: string } | { username: string }) => {
  if ("id" in data) {
    const user = await DI.userRepositroy.findOne({
      id: data.id,
    });

    if (!user) {
      throw errors.USER_NOT_FOUND;
    }
    return user;
  } else {
    const user = await DI.userRepositroy.findOne({
      username: data.username,
    });

    if (!user) {
      throw errors.USERNAME_NOT_FOUND;
    }
    return user;
  }
};

export const isProd = () => {
  return getEnv("NODE_ENV") === "prod" || getEnv("APP_ENV") === "vercel";
};
