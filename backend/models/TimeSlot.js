const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'cancelled', 'reserved'],
    default: 'available'
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    required: true,
    default: 'offline'
  },
  reservedUntil: {
    type: Date,
    default: null
  },
  reservedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  }
}, { timestamps: true });

timeSlotSchema.index({ facultyId: 1, date: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ facultyId: 1, status: 1, date: 1 });

timeSlotSchema.pre('validate', function() {
  if (this.startTime && this.endTime && this.startTime >= this.endTime) {
    this.invalidate('startTime', 'Start time must be before end time');
  }
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
