import "dotenv/config";
import { io } from "socket.io-client";

const BASE_URL = "http://127.0.0.1:5000";
const CONVERSATION_ID = "6ad5bf1604b21353a520eb69";

// Set these in backend/.env using fresh login tokens.
const TOKEN_A = process.env.TEST_JWT;
const TOKEN_B = process.env.TEST_JWT_B;

const socketA = io(BASE_URL, {
  auth: { token: TOKEN_A },
  reconnection: false,
  timeout: 5000,
});

const socketB = io(BASE_URL, {
  auth: { token: TOKEN_B },
  reconnection: false,
  timeout: 5000,
});

let finished = false;
let received = false;

function finish(code) {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  socketA.disconnect();
  socketB.disconnect();
  process.exitCode = code;
}

const timer = setTimeout(() => {
  console.error("FAIL: Timed out waiting for recipient");
  finish(1);
}, 10000);

socketA.on("connect_error", (error) => {
  console.error("Socket A connection failed:", error.message);
  finish(1);
});

socketB.on("connect_error", (error) => {
  console.error("Socket B connection failed:", error.message);
  finish(1);
});

socketB.on("message:new", (message) => {
  if (message.originalText === "Hello, second participant!") {
    received = true;
    console.log("PASS: Second participant received the message");
    console.log("Message ID:", message.id);
    finish(0);
  }
});

socketA.on("connect", () => {
  socketA.emit("conversation:join", CONVERSATION_ID, (result) => {
    if (!result?.ok) {
      console.error("Socket A could not join:", result);
      return finish(1);
    }

    if (socketB.connected) joinB();
  });
});

let aJoined = false;
let bJoined = false;

function maybeSend() {
  if (!aJoined || !bJoined) return;

  socketA.emit(
    "message:send",
    {
      conversationId: CONVERSATION_ID,
      originalText: "Hello, second participant!",
      sourceLanguage: "en",
    },
    (result) => {
      if (!result?.ok) {
        console.error("Send failed:", result);
        finish(1);
      } else {
        console.log("PASS: Sender received acknowledgement");
      }
    }
  );
}

function joinB() {
  if (bJoined) return;

  socketB.emit("conversation:join", CONVERSATION_ID, (result) => {
    if (!result?.ok) {
      console.error("Socket B could not join:", result);
      return finish(1);
    }

    bJoined = true;
    maybeSend();
  });
}

socketA.on("connect", () => {
  if (aJoined) return;
  aJoined = true;
  maybeSend();
});

socketB.on("connect", joinB);
