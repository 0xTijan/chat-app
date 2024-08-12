CREATE DATABASE chat_app;

CREATE TYPE message_type AS ENUM ('user', 'system');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  owner INTEGER references users(id),
  password_hash VARCHAR(255),   -- NULL for public rooms
  is_private BOOLEAN DEFAULT FALSE
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER references users(id),
  room_id INTEGER references rooms(id),
  message_type message_type NOT NULL DEFAULT 'user'
);

CREATE TABLE room_members (
  user_id INTEGER references users(id) ON DELETE CASCADE,
  room_id INTEGER references rooms(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, room_id)
);

CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_room_membership ON room_members(room_id, user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);