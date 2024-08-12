import express, { Application, Request, Response } from 'express';
import cors from "cors";
import authRouter from "./routers/authRouter";
import roomsRouter from "./routers/roomsRouter";
import session from "express-session";
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'node:http';


dotenv.config();
const app: Application = express();
const port: number = 3000;
const server = createServer(app);
const io = new Server(server);


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
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});