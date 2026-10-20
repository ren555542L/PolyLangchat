import "./config/dns.js";
import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import socketAuth from "./middleware/socketAuth.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import mongoose from "mongoose";

const port = Number(process.env.PORT || 5000);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("message:send", async (data, callback) => {
  try {
    const respond = (result) => {
      if (typeof callback === "function") callback(result);
    };

    if (
      !data ||
      typeof data.conversationId !== "string" ||
      !mongoose.isValidObjectId(data.conversationId) ||
      typeof data.originalText !== "string" ||
      !data.originalText.trim() ||
      data.originalText.trim().length > 5000 ||
      typeof data.sourceLanguage !== "string" ||
      !["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "hi-Latn"].includes(data.sourceLanguage)
    ) {
      return respond({ ok: false, error: "Invalid message data" });
    }

    const conversation = await Conversation.findOne({
      _id: data.conversationId,
      participants: socket.data.userId,
    }).select("_id");

    if (!conversation) {
      return respond({ ok: false, error: "Conversation not found or access denied" });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: socket.data.userId,
      originalText: data.originalText.trim(),
      sourceLanguage: data.sourceLanguage,
    });

    const payload = {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId.toString(),
      originalText: message.originalText,
      sourceLanguage: message.sourceLanguage,
      createdAt: message.createdAt,
    };

    io.to(`conversation:${data.conversationId}`).emit("message:new", payload);

    respond({ ok: true, message: payload });
  } catch (error) {
    console.error("Socket message send failed:", error.message);
    if (typeof callback === "function") {
      callback({ ok: false, error: "Unable to send message" });
    }
  }
});
  socket.on("conversation:join", async (conversationId, callback) => {
  try {
    if (typeof conversationId !== "string") {
      return callback?.({ ok: false, error: "Invalid conversation ID" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: socket.data.userId,
    }).select("_id");

    if (!conversation) {
      return callback?.({
        ok: false,
        error: "Conversation not found or access denied",
      });
    }

    socket.join(`conversation:${conversationId}`);

    callback?.({ ok: true, conversationId });
  } catch {
    callback?.({ ok: false, error: "Unable to join conversation" });
  }
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

try {
  await connectDB();
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
}