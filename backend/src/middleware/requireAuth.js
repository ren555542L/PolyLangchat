
import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
