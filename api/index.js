"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.appRouter = void 0;
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const trpc_1 = require("../trpc");
const ws_1 = __importDefault(require("ws"));
const express_1 = __importDefault(require("express"));
const express_2 = require("@trpc/server/adapters/express");
const ws_2 = require("@trpc/server/adapters/ws");
const cors_1 = __importDefault(require("cors"));
const database_1 = require("../database");
const controllers_1 = require("../controllers");
const game_controller_1 = require("../controllers/game.controller");
const utils_1 = require("../utils");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.appRouter = (0, trpc_1.router)({
    user: controllers_1.userRouter,
    room: controllers_1.roomRouter,
    game: game_controller_1.gameRouter,
});
const PORT_STRING = process.env.PORT;
if (!PORT_STRING) {
    throw new Error("PORT env is not defined");
}
const PORT = parseInt(PORT_STRING);
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, database_1.initDatabase)();
    const wss = new ws_1.default.Server({
        server,
    });
    (0, ws_2.applyWSSHandler)({ wss, router: exports.appRouter, createContext: trpc_1.createContext });
    if (!(0, utils_1.isProduction)()) {
        wss.on("listening", () => {
            console.log(`WebSocket server listening on port ${PORT}`);
        });
        wss.on("connection", (ws) => {
            console.log("+ WebSocket connection");
            ws.once("close", () => {
                console.log("- WebSocket connection");
            });
        });
    }
    app.use((0, cors_1.default)({ credentials: true, origin: (0, utils_1.isProduction)() ? undefined : "http://localhost:3000" }));
    app.use("/api/trpc", (0, express_2.createExpressMiddleware)({
        router: exports.appRouter,
        createContext: trpc_1.createContext,
    }));
    !(0, utils_1.isProduction)() && server.listen(PORT, "localhost", () => {
        console.log(`HTTP server listening on port ${PORT}`);
    });
}))();
exports.config = {
    runtime: 'edge',
};
exports.default = app;
