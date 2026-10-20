
import jwt from "jsonwebtoken";

export default function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof payload.sub !== "string") {
      return next(new Error("Invalid token"));
    }

    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
