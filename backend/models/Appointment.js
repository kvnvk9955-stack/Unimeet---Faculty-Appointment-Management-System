const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true,
    minLength: 10,
    maxLength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'missed', 'rescheduled'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    maxLength: 300
  },
  cancellationReason: {
    type: String,
    maxLength: 300
  },
  cancelledBy: {
    type: String,
    enum: ['student', 'faculty', 'admin']
  },
  meetingLink: String,
  reminderSent: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    required: true,
    default: 'offline'
  },
  rescheduledTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  suggestedSlotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlot',
    default: null
  },
  rescheduleMessage: {
    type: String,
    maxLength: 500
  },
  rescheduleStatus: {
    type: String,
    enum: ['pending_student', 'confirmed', 'declined', 'expired'],
    default: null
  }
}, { timestamps: true });

appointmentSchema.index({ studentId: 1, status: 1 });
appointmentSchema.index({ facultyId: 1, status: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ status: 1, updatedAt: 1 });
appointmentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
