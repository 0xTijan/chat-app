import express from 'express';
import { pool } from '../db';
import bcrypt from "bcrypt";
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';


const router = express.Router();

// GET ROOMS
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(500).json({message: "Missing user"});
    return;
  }

  try {
    // get all rooms where user is in (get from room members)
    const joinedRooms = await pool.query(
      "SELECT * FROM rooms r JOIN room_members m ON r.id = m.room_id WHERE m.user_id=$1;",
      [req.user.id]
    );

    // plus all rooms where he can join (public rooms where is not member)
    const availableRooms = await pool.query(
      "SELECT r.* FROM rooms r LEFT JOIN room_members m ON r.id=m.room_id AND m.user_id=$1 WHERE r.is_private=false AND m.user_id IS NULL;",
      [req.user.id]
    );
    
    // return {available, joined}
    res.json({
      joinedRooms: joinedRooms.rows,
      availableRooms: availableRooms.rows
    });
  } catch (err) {
    const error = err as any;
    res.status(500).json({error: error.message});
  }
});

// CREATE
router.post("/create", authenticateToken, async (req: AuthenticatedRequest, res) => { 
  // create room (row in rooms)
  let createdRoomId: null | string = null;

  if (!req.user) {
    res.status(500).json({message: "Missing user"});
    return;
  }

  try {
    let passwordHash = null;
    if (req.body.is_private) {
      passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    const newRoomQuery = await pool.query(
      "INSERT INTO rooms(name, owner, password_hash, is_private) values ($1,$2,$3,$4) RETURNING id, name",
      [
        req.body.name,
        req.user.id,
        passwordHash,
        req.body.is_private
      ]
    );

    if (newRoomQuery.rows[0].id) {
      createdRoomId = newRoomQuery.rows[0].id;
    }
  } catch(err) {
    res.json({
      status: "Room name already taken."
    });
    return;
  }

  if (!createdRoomId) {
    res.json({
      status: "Creation of room failed."
    });
    return;
  }

  // create row in room_members (owner)
  try {
    const newRoomMemberQuery = await pool.query(
      "INSERT INTO room_members(user_id, room_id) values ($1,$2)",
      [req.user.id, createdRoomId]
    );
  } catch(err) {
    // second step failed delete room
    const deleteRoomQuery = await pool.query(
      "DELETE FROM rooms r WHERE r.id=$1 CASCADE",
      [createdRoomId]
    );
    res.json({
      status: "Could not create room."
    });
    return;
  }

  // create new row in messages - system ("x" created room)
  try {
    const newMessageQuery = await pool.query(
      "INSERT INTO messages(content, user_id, room_id, message_type) values ($1,$2,$3,$4)",
      [
        `${req.user.username} created group ${req.body.name}`,
        req.user.id,
        createdRoomId,
        "system"
      ]
    );
    res.json({
      status: "Success",
    });
    return;
  } catch(err) {
    const deleteRoomQuery = await pool.query(
      "DELETE FROM rooms r WHERE r.id=$1 CASCADE",
      [createdRoomId]
    );
    // second step failed delete room
    const deleteRoomMemberQuery = await pool.query(
      "DELETE FROM rooms_members r WHERE r.user_id=$1 AND r.room_id=$2 CASCADE",
      [req.user.id, createdRoomId]
    );
    // second step failed delete room
    res.json({
      status: "Could not create room."
    });
    return;
  }
});

// JOIN
router.post("/join", authenticateToken, async (req: AuthenticatedRequest, res) => {
  // get caller id and name
  if (!req.user) {
    res.status(500).json({message: "Missing user"});
    return;
  }

  // check if room is private (check password)
  console.log(req.body.id, req.body.name);
  const roomsQuery = await pool.query(
    "SELECT * FROM rooms r WHERE r.id=$1 AND r.name=$2",
    [req.body.id, req.body.name]
  );

  // check password
  if(roomsQuery.rows[0].is_private) {
    const isOk = await bcrypt.compare(req.body.password, roomsQuery.rows[0].password_hash);
    if (!isOk) {
      res.json({message: "Incorrect password."});
      return;
    }
  }

  // add row to room_members
  try {
    const newRoomMemberQuery = await pool.query(
      "INSERT INTO room_members(user_id, room_id) values ($1,$2)",
      [req.user.id, req.body.id]
    );
    res.json({
      success: true,
    });
  } catch(err) {
    console.log(err);
    res.status(500).send(err);
  }

  // add new system message to messages
  try {
    const newMessageQuery = await pool.query(
      "INSERT INTO messages(content, user_id, room_id, message_type) values ($1,$2,$3,$4)",
      [
        `${req.user.username} joined group ${req.body.name}`,
        req.user.id,
        req.body.id,
        "system"
      ]
    );
    res.json({
      status: "Success",
    });
    return;
  } catch(err) {
    // second step failed delete room
    const deleteRoomMemberQuery = await pool.query(
      "DELETE FROM rooms_members r WHERE r.user_id=$1 AND r.room_id=$2 CASCADE",
      [req.user.id, req.body.id]
    );
    // second step failed delete room
    res.json({
      status: "Could not join room."
    });
    return;
  }
});

// DELETE
router.delete("/delete", authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(500).json({message: "Missing user"});
    return;
  }

  // check if caller is owner
  const roomsQuery = await pool.query(
    "SELECT * FROM rooms r WHERE r.id=$1",
    [req.body.id]
  );

  if(roomsQuery.rows[0].owner === req.user.id) { 
    const deleteRoomQuery = await pool.query(
      `WITH deleted_messages AS (
        DELETE FROM messages WHERE room_id=$1
      ), deleted_room_members AS (
        DELETE FROM room_members WHERE room_id=$1
      )
      DELETE FROM rooms WHERE id=$1;`,
      [req.body.id]
    );
    res.json({
      "success": true
    });
  }else{
    res.json({
      message: "Not owner."
    });
  }
});


export default router;