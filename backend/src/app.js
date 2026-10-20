import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import conversationRoutes from "./routes/conversations.js";
import messageRoutes from "./routes/messages.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
}));

app.use(express.json({ limit: "16kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "polyglot-backend",
  });
});

export default app;