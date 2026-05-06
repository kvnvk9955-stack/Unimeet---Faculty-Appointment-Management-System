# Unimeet – Faculty Appointment Management System

## Introduction
Unimeet is a web-based Faculty Appointment Management System designed to simplify and organize the interaction between students and faculty members in universities and colleges.

Traditional appointment methods like emails or direct visits are often inefficient, leading to scheduling conflicts and wasted time. Unimeet provides a centralized platform where students can easily book appointments with faculty based on available time slots.

---

## Features

- User Authentication (Student / Faculty / Admin)
- Faculty Profile Management
- ime Slot Creation & Management
- Appointment Booking System
-  Conflict-Free Scheduling
-  Appointment Approval / Rejection
-  Rescheduling & Cancellation
-  Notification System
-  Admin Dashboard with Reports
-  Appointment History Tracking
-  Role-Based Access Control

---

## Tech Stack

### Frontend
- React.js
- HTML5
- CSS3

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- JWT (JSON Web Tokens)
- bcrypt.js

### Tools
- Postman
- Git & GitHub

### Optional
- Nodemailer (Email Notifications)
- Socket.io (Real-time Updates)

---

##  System Architecture

- **Frontend:** React-based responsive UI  
- **Backend:** REST APIs using Express.js  
- **Database:** MongoDB for storing users, appointments, and slots  
- **Authentication:** JWT-based secure login system  
- **Notification Service:** Alerts for booking, approval, and cancellation  

---

##  Project Flow

###  Student Flow
1. Register/Login
2. Search Faculty
3. View Available Slots
4. Book Appointment
5. Receive Confirmation
6. Manage Appointments

###  Faculty Flow
1. Login
2. Create Time Slots
3. View Requests
4. Approve/Reject Appointments
5. Manage Schedule

###  Admin Flow
1. Manage Users
2. Monitor Appointments
3. Generate Reports
4. Handle Issues

---

## Database Collections

### Users
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "password": "hashed_password",
  "role": "student"
}
FACULTY
{
  "facultyName": "Dr. Sharma",
  "department": "Computer Science",
  "email": "drsharma@example.com",
  "availableSlots": ["10:00 AM", "11:00 AM"]
}
APPOINTMENTS
{
  "studentName": "Ravi Kumar",
  "facultyName": "Dr. Sharma",
  "date": "2024-12-25",
  "time": "10:00 AM",
  "status": "pending"
}
NOTIFICATIONS
{
  "userId": "user_id_reference",
  "message": "Your appointment has been confirmed",
  "type": "appointment",
  "isRead": false
}
```

//Project Structure
Frontend (client/)
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   ├── utils/
│   ├── App.js
│   ├── index.js
│   ├── routes.js
Backend (server/)
server/
├── config/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── server.js

  Installation & Setup
1️ Clone the Repository
git clone https://github.com/your-username/unimeet.git
cd unimeet
2️ Setup Backend
cd server
npm install

Create a .env file:

PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key

Run backend:

npm run dev
3️ Setup Frontend
cd client
npm install
npm start

 Authentication & Roles
Student: Book & manage appointments
Faculty: Manage slots & approve requests
Admin: Monitor system & generate reports
 Future Enhancements
 SMS Notifications
Chat System
Feedback & Rating System
 Mobile App Version
 Learning Outcomes
Full Stack Development (MERN)
REST API Design
JWT Authentication
MongoDB Schema Design
Real-time Scheduling Systems
Role-Based Access Control

 Contribution

Contributions are welcome!

Fork the repo
Create a new branch
Commit your changes
Push to your branch
Open a Pull Request

##  Author

Developed by KVN Vamsi Krishna
