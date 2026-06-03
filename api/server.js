require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const membersRoutes = require('./routes/members');
const uploadRoutes = require('./routes/upload');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { assertSupabaseEnv, testSupabaseConnection } = require('./config/supabase');
const { assertCloudinaryEnv } = require('./config/cloudinary');

const app = express();
const port = Number(process.env.PORT) || 3000;

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ADMIN_PASSWORD_HASH',
  'JWT_SECRET'
];

const validateEnvironment = () => {
  const missing = requiredEnv.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  assertSupabaseEnv();
  assertCloudinaryEnv();
};

const parseAllowedOrigins = () => {
  const configured = process.env.ALLOWED_ORIGINS || '';
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

app.get('/api/cors-test', (req, res) => {
  res.json({
    origin: req.headers.origin,
    allowedOrigins
  });
});

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin is not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.'
    }
  }
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/admin', authRoutes);
app.use('/api/team-members', membersRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  validateEnvironment();
  await testSupabaseConnection();

  app.listen(port, () => {
    console.log(`Penta Minds API listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start Penta Minds API:', error.message);
    process.exit(1);
  });
}

module.exports = app;
