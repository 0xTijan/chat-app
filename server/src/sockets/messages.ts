import { io } from "..";
import { pool } from "../db";
import { AuthenticatedSocket } from "../middleware/auth";

export const handleMessage = async (msg: {content: string, room_id: number}, socket: AuthenticatedSocket) => {
  if (socket.user) {
    // Save message to the database
    const isSaved = await saveMessage(msg, socket.user?.id);
  
    // send message to room
    if (isSaved) {
      await sendMessageToRoomSocket(msg, socket.user?.id);
      return true;
    } else {
      return false;
    }
  } else {
    console.log("not authorized");
    return false;
  }
};

const saveMessage = async (msg: {content: string, room_id: number}, user_id: number) => {
  // check if member
  const rmQuery = await pool.query(
    "SELECT FROM room_members r WHERE r.user_id=$1 AND r.room_id=$2",
    [user_id, msg.room_id]
  );

  if ((rmQuery.rowCount || 0) >0) {
    // save to DB
    await pool.query(
      'INSERT INTO messages (content, user_id, room_id) VALUES ($1, $2, $3)',
      [msg.content, user_id, msg.room_id]
    );
    return true;
  } else {
    return false;
  }
};

const sendMessageToRoomSocket = async (msg: {content: string, room_id: number}, user_id: number) => {
  // Broadcast message to all clients in the same room
  io.to(msg.room_id.toString()).emit('chat message', {...msg, user_id: user_id});
};
