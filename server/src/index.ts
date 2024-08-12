import express, { Application, Request, Response } from 'express';
import cors from "cors";
import authRouter from "./routers/authRouter";
import roomsRouter from "./routers/roomsRouter";
import session from "express-session";
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { pool } from './db';
import { authorizeTokenSocket } from './middleware/auth';
import { handleMessage } from './sockets/messages';
import { handleJoinRoom, handleLeaveRoom } from './sockets/rooms';


dotenv.config();
const app: Application = express();
const port: number = 3000;
const server = createServer(app);
export const io = new Server(server);


// MIDDLEWAREs
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.COOKIE_SECRET || "",
  name: "sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.ENVIRONMENT === "production",
    httpOnly: true,
    sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
  }
}));


// ROUTES
app.use("/auth", authRouter);   // auth - login, signup
app.use("/rooms", roomsRouter); // rooms - create, delete, join


// SOCKETS
io.use(authorizeTokenSocket);

io.on('connection', (socket) => {
  // Handle incoming messages
  socket.on('message', async (msg) => {
    const isDone = await handleMessage(msg, socket);
    if(!isDone) {
      socket.emit("error", { message: "Must be a member!" });
    }
  });

  // join room
  socket.on("join room", async (msg) => {
    const isDone = await handleJoinRoom(msg, socket);
    if(!isDone) {
      socket.emit("error", { message: "" });
    }
  });

  // leave room
  socket.on("leave room", async (msg) => {
    const isDone = await handleLeaveRoom(msg, socket);
    if(!isDone) {
      socket.emit("error", { message: "" });
    }
  });


  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});