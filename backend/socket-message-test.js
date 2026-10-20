import "dotenv/config";
import { io } from "socket.io-client";

const BASE_URL = "http://127.0.0.1:5000";
const TOKEN = process.env.TEST_JWT;
const CONVERSATION_ID = "6ad5bf1604b21353a520eb69";

const socket = io(BASE_URL, {
  auth: { token: TOKEN },
  reconnection: false,
  timeout: 5000,
});

let finished = false;

function finish(code = 0) {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  socket.disconnect();
  process.exitCode = code;
}

const timer = setTimeout(() => {
  console.error("FAIL: Timed out waiting for message");
  finish(1);
}, 10000);

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
  finish(1);
});

socket.on("connect", () => {
  socket.emit("conversation:join", CONVERSATION_ID, (joinResult) => {
    if (!joinResult?.ok) {
      console.error("Room join failed:", joinResult);
      return finish(1);
    }

    socket.once("message:new", (message) => {
      console.log("PASS: Received room broadcast");
      console.log("Message:", message.originalText);
      console.log("Message ID:", message.id);
      finish(0);
    });

    socket.emit(
      "message:send",
      {
        conversationId: CONVERSATION_ID,
        originalText: "Hello from the socket test!",
        sourceLanguage: "en",
      },
      (result) => {
        if (!result?.ok) {
          console.error("Message send failed:", result);
          return finish(1);
        }

        console.log("PASS: Server acknowledged saved message");
      }
    );
  });
});
