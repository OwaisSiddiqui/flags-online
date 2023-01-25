import React from "react";
import ReactDOM from "react-dom";
import Home from "./App";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Room from "./pages/Room";
import "./index.css";
import CreateRoom from "./pages/CreateRoom";
import Rooms from "./pages/Rooms";
import Game from "./pages/Game";
import { Landing } from "./pages/Landing";

ReactDOM.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />}>
        <Route index element={<Landing />} />
        <Route path="home" element={<Rooms />} />
        <Route path="room" element={<Room />} />
        <Route path="game" element={<Game />} />
        <Route path="create-room" element={<CreateRoom />} />
      </Route>
    </Routes>
  </BrowserRouter>,
  document.getElementById("root")
);
