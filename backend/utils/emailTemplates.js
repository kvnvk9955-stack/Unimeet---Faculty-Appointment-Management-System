// Color scheme based on specifications: Indigo #4F46E5

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; color: #111827; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #4F46E5; margin: 0; }
    .content { font-size: 16px; line-height: 1.6; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Unimeet</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from the Unimeet Faculty Appointment System.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  appointmentBookedStudent: (studentName, facultyName, date, timeSlot, purpose) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p>Your appointment request has been sent to <strong>${facultyName}</strong>.</p>
    <ul>
      <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
      <li><strong>Time:</strong> ${timeSlot}</li>
      <li><strong>Purpose:</strong> ${purpose}</li>
    </ul>
    <p>You will be notified once the faculty member approves or rejects your request.</p>
  `),
  
  appointmentBookedFaculty: (facultyName, studentName, date, timeSlot, purpose) => baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p>You have a new appointment request from <strong>${studentName}</strong>.</p>
    <ul>
      <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
      <li><strong>Time:</strong> ${timeSlot}</li>
      <li><strong>Purpose:</strong> ${purpose}</li>
    </ul>
    <p>Please log in to your dashboard to approve or reject this request.</p>
  `),

  appointmentApproved: (studentName, facultyName, date, timeSlot) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p>Your appointment with <strong>${facultyName}</strong> has been <strong>approved</strong>.</p>
    <ul>
      <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
      <li><strong>Time:</strong> ${timeSlot}</li>
    </ul>
    <p>If this is an online meeting, the faculty will provide a meeting link separately.</p>
  `),

  meetingLinkAdded: (studentName, facultyName, date, timeSlot, meetingLink) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p>A meeting link has been added for your approved online appointment with <strong>${facultyName}</strong>.</p>
    <ul>
      <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
      <li><strong>Time:</strong> ${timeSlot}</li>
      <li><strong>Meeting Link:</strong> <a href="${meetingLink}">Join Here</a></li>
    </ul>
  `),

  appointmentRejected: (studentName, facultyName, date, timeSlot, reason) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p>Unfortunately, your appointment request with <strong>${facultyName}</strong> for ${new Date(date).toDateString()} at ${timeSlot} has been <strong>rejected</strong>.</p>
    ${reason ? '<p><strong>Reason:</strong> ' + reason + '</p>' : ''}
  `),

  appointmentCancelledByStudent: (facultyName, studentName, date, timeSlot) => baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p><strong>${studentName}</strong> has cancelled the upcoming appointment scheduled for ${new Date(date).toDateString()} at ${timeSlot}.</p>
    <p>The time slot has been freed up and is now available for other students.</p>
  `),

  appointmentCancelledByFaculty: (studentName, facultyName, date, timeSlot) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p><strong>${facultyName}</strong> has cancelled the upcoming appointment scheduled for ${new Date(date).toDateString()} at ${timeSlot}.</p>
  `),

  appointmentReminder: (studentName, facultyName, date, timeSlot) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p>This is a reminder for your upcoming appointment with <strong>${facultyName}</strong>.</p>
    <p><strong>Date:</strong> ${new Date(date).toDateString()}<br/>
    <strong>Time:</strong> ${timeSlot}</p>
  `),

  welcomeEmail: (name, role) => baseTemplate(`
    <p>Dear ${name},</p>
    <p>Welcome to Unimeet! Your account has been successfully created.</p>
    <p>Role: <strong>${role}</strong></p>
    ${role === 'faculty' ? '<p>Please note: Your faculty account requires admin approval before you can receive appointments.</p>' : ''}
  `),

  passwordResetEmail: (name, resetURL) => baseTemplate(`
    <p>Hi ${name},</p>
    <p>You requested a password reset. Click the button below to set a new password:</p>
    <a href="${resetURL}" class="btn">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
  `),

  facultyApprovedEmail: (facultyName) => baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p>Great news! Your faculty account has been <strong>approved</strong> by the administrator.</p>
    <p>You can now log in, create available time slots, and manage student appointments.</p>
  `),

  rescheduleByFacultyEmail: (studentName, facultyName, oldDate, oldTime, newDate, newTime, message) => baseTemplate(`
    <p>Dear ${studentName},</p>
    <p><strong>${facultyName}</strong> has rescheduled your appointment.</p>
    <p><strong>Original:</strong> ${new Date(oldDate).toDateString()} at ${oldTime}</p>
    <p><strong>Suggested New Time:</strong> ${new Date(newDate).toDateString()} at ${newTime}</p>
    ${message ? '<p><strong>Message:</strong> ' + message + '</p>' : ''}
    <p>Please log in to confirm or decline the suggested new time. The slot is reserved for you for 24 hours.</p>
    <a href="${process.env.CLIENT_URL || 'http://localhost:8080'}/student/appointments" class="btn">View & Respond</a>
  `),

  rescheduleConfirmedEmail: (facultyName, studentName, date, timeSlot) => baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p><strong>${studentName}</strong> has confirmed the rescheduled appointment.</p>
    <ul>
      <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
      <li><strong>Time:</strong> ${timeSlot}</li>
    </ul>
    <p>The appointment is now pending your approval as usual.</p>
  `),

  rescheduleDeclinedEmail: (facultyName, studentName) => baseTemplate(`
    <p>Dear ${facultyName},</p>
    <p><strong>${studentName}</strong> has declined the rescheduled appointment suggestion.</p>
    <p>The reserved time slot has been released back to available. The student may book a new appointment at their convenience.</p>
  `)
};
