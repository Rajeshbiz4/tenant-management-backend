const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

dotenv.config();

const port = process.env.PORT || 8080;
const app = express();

// Middleware - MUST be before routes
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

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
const authenticateToken = require('./middleware/authenticateToken');
const userController = require('./modules/user/userController');
const PropertyController = require('./modules/Property/PropertyController');
const unitController = require('./modules/UNIT/unitController');

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Tenant Management System API',
    version: '1.0.0',
    status: 'Running'
  });
});

// Public routes
app.use('/user', userController);
app.use('/property', PropertyController);
app.use('/unit', unitController);
// Protected routes (uncomment when needed)
// app.use('/branch', authenticateToken, branchController);
// app.use('/images', authenticateToken, imageController);

// expose swagger JSON explicitly
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type','application/json');
  res.send(swaggerSpec);
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

// app.listen(port, () => {
//   console.log(`✓ Server is running on port ${port}`);
//   console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`✓ API ready at http://localhost:${port}`);
// });
