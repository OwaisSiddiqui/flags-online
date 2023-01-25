import "dotenv/config";

import http from "http";
import { createContext, router } from "../trpc";
import ws from "ws";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import cors from "cors";
import { initDatabase } from "../database";
import { userRouter, roomRouter } from "../controllers";
import { gameRouter } from "../controllers/game.controller";
import { isProduction } from "../utils";

const app = express();
const server = http.createServer(app);

export const appRouter = router({
  user: userRouter,
  room: roomRouter,
  game: gameRouter,
});
export type AppRouter = typeof appRouter;

const PORT_STRING = process.env.PORT;
if (!PORT_STRING) {
  throw new Error("PORT env is not defined");
}
const PORT = parseInt(PORT_STRING);

(async () => {
  await initDatabase();

  const wss = new ws.Server({
    server,
  });
  applyWSSHandler({ wss, router: appRouter, createContext });
  wss.on("listening", () => {
    console.log(`WebSocket server listening on port ${PORT}`);
  });
  wss.on("connection", (ws) => {
    console.log("+ WebSocket connection");
    ws.once("close", () => {
      console.log("- WebSocket connection");
    });
  });

  app.use(cors({ credentials: true, origin: isProduction() ? undefined : "http://localhost:3000" }));
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  !isProduction() && server.listen(PORT, "localhost", () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });
})();

module.exports = app