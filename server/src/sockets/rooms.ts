import { AuthenticatedSocket } from "../middleware/auth";


export const handleJoinRoom = async (msg: {room_id: number}, socket: AuthenticatedSocket) => {
  if (socket.user) {
    await socket.join(msg.room_id.toString());
    console.log("joined room ", msg.room_id);
  } else {
    console.log("not authorized");
    return false;
  }
};

export const handleLeaveRoom = async (msg: {room_id: number}, socket: AuthenticatedSocket) => {
  if (socket.user) {
    await socket.leave(msg.room_id.toString());
    console.log("left room ", msg.room_id);
  } else {
    console.log("not authorized");
    return false;
  }
};
