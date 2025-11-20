const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./config/database');

dotenv.config();

// Connect to MongoDB
connectDB();

const port = process.env.PORT || 8080;
const app = express();

// Middleware - MUST be before routes
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins by default, or set specific origin via env
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // Allow cookies and authentication headers
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Custom JSON error handler (catches parse errors)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ Bad JSON received:', err.body);
    return res.status(400).json({ 
      error: true, 
      message: 'Invalid JSON format',
      details: 'Please send valid JSON with properly quoted keys and values'
    });
  }
  next(err);
});

// Routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Tenant Management System API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/properties', propertyRoutes);
app.use('/tenant', tenantRoutes);
app.use('/stats', statsRoutes);

// expose swagger JSON endpoint
app.get('/api-docs/swagger.json', (req, res) => {
  res.type('application/json');
  res.json(swaggerSpec);
});

// serve minimal HTML page that loads Swagger UI from CDN
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tenant Management API Docs</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: '/api-docs/swagger.json',
              dom_id: '#swagger-ui',
              presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
              layout: "StandaloneLayout",
              deepLinking: true
            });
          }
        </script>
      </body>
    </html>
  `);
});

// ensure swagger mounted here
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: '/api-docs/swagger.json' }
}));

// General Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({ 
    error: true, 
    message: err.message || 'Internal server error',
    type: err.type
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

app.listen(port, () => {
  console.log(`✓ Server is running on port ${port}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ API ready at http://localhost:${port}`);
});
