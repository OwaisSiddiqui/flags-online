"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    runtime: "edge",
};
exports.default = (req) => {
    return new Response(`Hello, from ${req.url} I'm now an Edge Function!`);
};
