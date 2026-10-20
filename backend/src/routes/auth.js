
import { Router } from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import requireAuth from "../middleware/requireAuth.js";

import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post(
  "/register",
  [
    body("username")
      .isString()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3–30 characters"),

    body("email")
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

    body("password")
      .isString()
      .isLength({ min: 8, max: 72 })
      .withMessage("Password must be 8–72 characters"),

    body("preferredLanguage")
      .optional()
      .isIn(["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa"])
      .withMessage("Unsupported preferred language"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map(({ path, msg }) => ({
          field: path,
          message: msg,
        })),
      });
    }

    try {
      const { username, email, password, preferredLanguage = "en" } = req.body;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await User.create({
        username,
        email,
        passwordHash,
        preferredLanguage,
      });

      return res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          preferredLanguage: user.preferredLanguage,
        },
      });
    } catch (error) {
      // Handles concurrent requests that race to register the same email.
      if (error.code === 11000) {
        return res.status(409).json({
          message: "An account with this email already exists",
        });
      }

      console.error("Registration failed:", error.message);

      return res.status(500).json({
        message: "Unable to create account",
      });
    }
  }
);

// Add this route inside the existing auth router.
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map(({ path, msg }) => ({
          field: path,
          message: msg,
        })),
      });
    }

    try {
      const { email, password } = req.body;

      // passwordHash has select: false in the User schema.
      const user = await User.findOne({ email }).select("+passwordHash");

      // Use the same error for unknown email and wrong password.
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
      }

      const token = jwt.sign(
        {},
        process.env.JWT_SECRET,
        {
          subject: user._id.toString(),
          expiresIn: process.env.JWT_EXPIRES_IN || "15m",
          algorithm: "HS256",
        }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          preferredLanguage: user.preferredLanguage,
        },
      });
    } catch (error) {
      console.error("Login failed:", error.message);

      return res.status(500).json({
        message: "Unable to log in",
      });
    }
  }
);


router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error) {
    console.error("Profile lookup failed:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve profile",
    });
  }
});


export default router;
