
import mongoose from "mongoose";

const messageTranslationSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetLanguage: {
      type: String,
      required: true,
      trim: true,
      maxlength: 35,
    },

    translatedText: {
      type: String,
      required: true,
      maxlength: 10000,
    },

    translationStatus: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
      required: true,
    },

    modelName: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

// One translation record per message, recipient and target language.
messageTranslationSchema.index(
  { messageId: 1, recipientId: 1, targetLanguage: 1 },
  { unique: true }
);

const MessageTranslation = mongoose.model(
  "MessageTranslation",
  messageTranslationSchema
);

export default MessageTranslation;
