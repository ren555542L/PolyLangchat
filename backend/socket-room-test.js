import "dotenv/config";
import { io } from "socket.io-client";

const BASE_URL = "http://127.0.0.1:5000";
const TOKEN = process.env.TEST_JWT;

// Replace with the conversation ID returned by your successful API test.
const CONVERSATION_ID = "6ad5bf1604b21353a520eb69";

const socket = io(BASE_URL, {
  auth: { token: TOKEN },
  reconnection: false,
  timeout: 5000,
});

socket.on("connect", () => {
  socket.emit("conversation:join", CONVERSATION_ID, (result) => {
    console.log("Room join result:", result);
    socket.disconnect();
  });
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
  process.exitCode = 1;
});
