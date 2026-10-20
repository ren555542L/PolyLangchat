
import { Router } from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  body("participantId")
    .isString()
    .withMessage("Participant ID must be a string")
    .bail()
    .custom((id) => mongoose.isValidObjectId(id))
    .withMessage("Invalid participant ID"),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const currentUserId = req.userId;
      const participantId = req.body.participantId;

      if (currentUserId === participantId) {
        return res.status(400).json({
          message: "You cannot create a conversation with yourself",
        });
      }

      const participant = await User.findById(participantId).select("_id");

      if (!participant) {
        return res.status(404).json({
          message: "Participant not found",
        });
      }

      // Reuse an existing direct conversation, regardless of participant order.
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, participantId], $size: 2 },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [currentUserId, participantId],
          createdBy: currentUserId,
        });
      }

      return res.status(200).json({
        conversation: {
          id: conversation._id,
          participants: conversation.participants,
          createdBy: conversation.createdBy,
          createdAt: conversation.createdAt,
        },
      });
    } catch (error) {
      console.error("Conversation creation failed:", error.message);

      return res.status(500).json({
        message: "Unable to create conversation",
      });
    }
  }
);

export default router;
