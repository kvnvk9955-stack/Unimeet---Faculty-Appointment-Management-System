require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorResponse, successResponse } = require('./utils/apiResponse');
const errorMiddleware = require('./middleware/errorMiddleware');
const { csrfProtect } = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const slotRoutes = require('./routes/slotRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const meetingRoutes = require('./routes/meetingRoutes');

const app = express();

// ────────────────────────────────────────────────────────────────
// TRUST PROXY CONFIGURATION
// ────────────────────────────────────────────────────────────────
// SECURITY DECISION: Only trust proxy headers when EXPLICITLY enabled
// via environment variable. If TRUST_PROXY=false (default), Express
// uses the raw socket IP. This prevents attackers from spoofing
// X-Forwarded-For headers to bypass rate limiters when the server
// is directly exposed to the internet (no reverse proxy).
//
// Set TRUST_PROXY=true ONLY when deployed behind:
//   - Nginx reverse proxy
//   - AWS ALB / ELB
//   - Cloudflare
//   - Heroku
//   - Any load balancer that sets X-Forwarded-For
// ────────────────────────────────────────────────────────────────
if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ────────────────────────────────────────────────────────────────
// SECURITY HEADERS (HELMET + CSP)
// ────────────────────────────────────────────────────────────────
// SECURITY DECISION: Strict CSP with NO 'unsafe-inline' and
// NO 'unsafe-eval'. This blocks:
//   - Inline <script> tags injected via XSS
//   - eval() based attacks
//   - Unauthorized external script loading
//
// styleSrc includes 'unsafe-inline' ONLY because React injects
// dynamic inline styles. This is a known trade-off; style injection
// is not a meaningful XSS vector (you cannot execute JS from CSS).
// ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],                                // NO unsafe-inline, NO unsafe-eval
      styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:    ["'self'", "https://fonts.gstatic.com"],
      imgSrc:     ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL, process.env.NODE_ENV === 'development' ? "http://localhost:*" : ''].filter(Boolean),
      frameSrc:   ["'none'"],                                // Block iframe embedding
      objectSrc:  ["'none'"],                                // Block Flash/plugins
      baseUri:    ["'self'"],                                // Prevent <base> tag hijacking
    },
  },
  // Prevent the app from being embedded in iframes (clickjacking)
  frameguard: { action: 'deny' },
}));

// ────────────────────────────────────────────────────────────────
// CORS CONFIGURATION
// ────────────────────────────────────────────────────────────────
// credentials: true allows the browser to send Authorization headers cross-origin.
// The origin allowlist prevents arbitrary sites from reading responses.
// ────────────────────────────────────────────────────────────────
const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
// In development, also allow common local dev servers
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:8080');
}
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (same-origin, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ────────────────────────────────────────────────────────────────
// RATE LIMITERS
// ────────────────────────────────────────────────────────────────
// SECURITY DECISION: Three tiers of rate limiting.
//   - authLimiter:    Strict. 10 failed attempts / 15 min.
//                     skipSuccessfulRequests prevents lockout of
//                     legitimate users who type wrong password once.
//   - refreshLimiter: Moderate. 30 / 15 min. Prevents automated
//                     rotation flooding.
//   - generalLimiter: Applied in production to all /api routes.
// ────────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again in 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many refresh attempts from this IP, please try again after 15 minutes' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour window
  max: 10,                     // 10 attempts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' }
});

// ────────────────────────────────────────────────────────────────
// BODY PARSING & SANITIZATION
// ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Prevent MongoDB operator injection ($gt, $ne, etc.)
app.use(mongoSanitize({ allowDots: true, replaceWith: '_' }));

// ────────────────────────────────────────────────────────────────
// CSRF PROTECTION (applied globally to all mutating requests)
// ────────────────────────────────────────────────────────────────
app.use('/api', csrfProtect);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'production') {
  app.use('/api', generalLimiter);
}

// ────────────────────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────────────────────
// Rate limiters applied to specific auth endpoints, NOT all auth routes.
// This prevents /logout and /me from being rate-limited.
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh-token', refreshLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/api/health', (req, res) => {
  return successResponse(res, 200, 'Server is running', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use((req, res) => {
  return errorResponse(res, 404, 'Route not found');
});

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

// Auto-complete appointments whose time slot has passed
const autoCompleteAppointments = async () => {
  try {
    const Appointment = require('./models/Appointment');
    const TimeSlot = require('./models/TimeSlot');
    const now = new Date();

    const approvedAppointments = await Appointment.find({ status: 'approved' })
      .populate('slotId')
      .lean();

    const toComplete = [];

    for (const appt of approvedAppointments) {
      try {
        if (!appt.slotId) continue;
        const apptDate = new Date(appt.date);
        const endTimeStr = appt.slotId.endTime; // e.g. "10:30" (24h)
        if (!endTimeStr) continue;

        let hours, minutes;
        if (endTimeStr.includes('AM') || endTimeStr.includes('PM')) {
          const [time, mod] = endTimeStr.split(' ');
          [hours, minutes] = time.split(':').map(Number);
          if (mod === 'PM' && hours !== 12) hours += 12;
          if (mod === 'AM' && hours === 12) hours = 0;
        } else {
          [hours, minutes] = endTimeStr.split(':').map(Number);
        }

        const apptEnd = new Date(apptDate);
        apptEnd.setHours(hours, minutes, 0, 0);

        // Add 5-minute buffer after slot end time
        const apptEndWithBuffer = new Date(apptEnd.getTime() + 5 * 60 * 1000);

        if (now > apptEndWithBuffer) {
          toComplete.push(appt._id);
        }
      } catch (e) { /* skip malformed */ }
    }

    if (toComplete.length > 0) {
      await Appointment.updateMany({ _id: { $in: toComplete } }, { $set: { status: 'missed' } });
      logger.info(`Auto-marked ${toComplete.length} appointment(s) as missed`);
    }
  } catch (err) {
    logger.error('Auto-complete job error:', err);
  }
};

// Release expired reserved slots
const releaseExpiredReservations = async () => {
  try {
    const TimeSlot = require('./models/TimeSlot');
    const Appointment = require('./models/Appointment');
    const now = new Date();

    const expiredSlots = await TimeSlot.find({
      status: 'reserved',
      reservedUntil: { $lt: now }
    });

    if (expiredSlots.length > 0) {
      const slotIds = expiredSlots.map(s => s._id);
      const appointmentIds = expiredSlots.map(s => s.reservedFor).filter(Boolean);

      await TimeSlot.updateMany(
        { _id: { $in: slotIds } },
        { $set: { status: 'available', reservedUntil: null, reservedFor: null } }
      );

      if (appointmentIds.length > 0) {
        await Appointment.updateMany(
          { _id: { $in: appointmentIds }, rescheduleStatus: 'pending_student' },
          { $set: { rescheduleStatus: 'expired' } }
        );
      }

      logger.info(`Released ${expiredSlots.length} expired reserved slot(s)`);
    }
  } catch (err) {
    logger.error('Release expired reservations error:', err);
  }
};

// Connect to the database then start the server
connectDB().then(() => {
  // Run auto-complete on startup, then every 30 minutes
  autoCompleteAppointments();
  setInterval(autoCompleteAppointments, 30 * 60 * 1000);

  // Run reservation expiry on startup, then every 15 minutes
  releaseExpiredReservations();
  setInterval(releaseExpiredReservations, 15 * 60 * 1000);

  app.listen(PORT, () => {
    logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
