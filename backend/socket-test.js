
import "dotenv/config";
import { io } from "socket.io-client";

const baseUrl = "http://127.0.0.1:5000";

const socket = io(baseUrl, {
  auth: {
    token: process.env.TEST_JWT,
  },
  reconnection: false,
  timeout: 5000,
});

socket.on("connect", () => {
  console.log("PASS: Authenticated socket connected");
  socket.disconnect();
});

socket.on("connect_error", (error) => {
  console.log("Message:", error.message);
  console.log("Description:", error.description);
  console.log("Context:", error.context);

  process.exitCode = 1;
  socket.disconnect();
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
