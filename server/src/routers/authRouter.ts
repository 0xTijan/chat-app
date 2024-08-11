import express from 'express';
import { pool } from '../db';
import bcrypt from "bcrypt";


const router = express.Router();

router.post("/login", async (req, res) => {
  const potentialLogin = await pool.query(
    "SELECT id, username, password_hash FROM users u WHERE u.username=$1",
    [req.body.username]
  );

  if ((potentialLogin.rowCount || 0) > 0) {
    const isOk = await bcrypt.compare(req.body.password, potentialLogin.rows[0].password_hash);
    
    if (isOk) {
      // login
      req.session.user = {
        username: potentialLogin.rows[0].username,
        id: potentialLogin.rows[0].id,
      };
      res.json({
        loggedIn: true,
        username: potentialLogin.rows[0].username
      });
    } else {
      // not 
      res.json({
        loggedIn: false,
        status: "Wrong username or password."
      });
    }
  } else {
    res.json({
      loggedIn: false,
      status: "Wrong username or password."
    });
  }
});

router.post("/signup", async (req, res) => {
  const existingUser = await pool.query(
    "SELECT username from users WHERE username=$1",
    [req.body.username]
  );

  if (existingUser.rowCount === 0) {
    // register
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUserQuery = await pool.query(
      "INSERT INTO users(username, password_hash) values ($1,$2) RETURNING id, username",
      [req.body.username, hashedPassword]
    );
    req.session.user = {
      username: newUserQuery.rows[0].username,
      id: newUserQuery.rows[0].id,
    };
    res.json({
      loggedIn: true,
      username: newUserQuery.rows[0].username
    });
  } else {
    res.json({
      loggedIn: false,
      status: "Username taken"
    });
  }
});

export default router;