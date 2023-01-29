import { z } from "zod";

export const SignupSchema = z.object({
  password: z.string(),
  repeatPassword: z.string(),
  username: z.string(),
});

export const UserExistsSchema = z.object({
  username: z.string(),
});

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const AddRoomSchema = z.object({
  roomName: z.string(),
});

export const RoomSchema = z.object({
  roomId: z.string(),
});

export const FlagSchema = z.object({
  flagName: z.string(),
});

export const QuestionSchema = z.object({
  questionId: z.string(),
});

export const PusherUserAuthSchema = z.object({
  socketId: z.string(),
  channelName: z.string(),
});
