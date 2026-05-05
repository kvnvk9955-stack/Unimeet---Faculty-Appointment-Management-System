const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a meeting title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    facultyId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    externalUrl: {
      type: String,
      required: [true, 'Please provide the real meeting link (e.g. Google Meet)'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    joinLogs: [
      {
        studentName: String,
        joinedAt: { type: Date, default: Date.now },
        ipAddress: String,
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Meeting', meetingSchema);
