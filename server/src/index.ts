import express, { Application, Request, Response } from 'express';
import { pool } from './db';
import cors from "cors";
import authRouter from "./routers/authRouter";
import session from "express-session";
import dotenv from 'dotenv';

dotenv.config();
const app: Application = express();
const port: number = 3000;

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
}))


// ROUTES
app.use("/auth", authRouter);

app.get('/', (req: Request, res: Response) => {
  pool
    .connect()
    .then(() => {
      res.send('Connected to PostgreSQL database');
    })
    .catch((err) => {
      res.send('Error connecting to PostgreSQL database ' + err);
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});