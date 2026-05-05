const mongoose = require('mongoose');

const departmentsList = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'MBA', 'MCA', 'Mathematics', 'Physics', 'Chemistry', 'English'
];

const facultySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: departmentsList
  },
  designation: {
    type: String,
    required: true,
    enum: ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean']
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
  },
  officeRoom: String,
  bio: {
    type: String,
    maxLength: 1000
  },
  profilePhoto: String,
  isApproved: {
    type: Boolean,
    default: false
  },
  totalAppointments: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, { timestamps: true });

facultySchema.index({ isApproved: 1, department: 1 });
facultySchema.index({ totalAppointments: -1 });

module.exports = mongoose.model('Faculty', facultySchema);
