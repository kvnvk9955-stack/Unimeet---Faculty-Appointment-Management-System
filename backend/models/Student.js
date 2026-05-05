const mongoose = require('mongoose');

const departmentsList = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'MBA', 'MCA', 'Mathematics', 'Physics', 'Chemistry', 'English'
];

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: departmentsList
  },
  year: {
    type: Number,
    enum: [1, 2, 3, 4]
  },
  phone: {
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
  },
  profilePhoto: String,
  bio: {
    type: String,
    maxLength: 500
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
