import { createTRPCReact } from "@trpc/react-query";
import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../api/index";

export const trpc = createTRPCReact<AppRouter>();

type RouterOutput = inferRouterOutputs<AppRouter>;

export type GetRoomsOutput = RouterOutput["room"]["getRooms"];

export type User = RouterOutput["user"]["getUser"];

export type Question = RouterOutput["game"]["currentQuestion"];
