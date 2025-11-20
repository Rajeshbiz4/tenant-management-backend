const swaggerJSDoc = require('swagger-jsdoc');
const pkg = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tenant Management API',
      version: pkg.version || '1.0.0',
      description: 'Complete API for managing properties, tenants, and rental operations with authentication',
      contact: {
        name: 'API Support',
        email: 'support@tenantmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: 'Development Server'
      },
      {
        url: 'https://api.tenantmanagement.com',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication. Include token in Authorization header without "Bearer" prefix.'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Error message' },
            details: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 }
          }
        },
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'ObjectId' },
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' }
                  }
                }
              }
            }
          }
        },
        Property: {
          type: 'object',
          required: ['propertyType', 'area', 'location', 'monthlyRent'],
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            propertyType: { 
              type: 'string', 
              enum: ['flat', 'shop', 'plot'],
              example: 'flat'
            },
            area: { type: 'number', example: 1200, description: 'Area in sq.ft' },
            location: { type: 'string', example: '123 Main Street, City' },
            monthlyRent: { type: 'number', example: 25000, description: 'Monthly rent in Rs.' },
            maintenance: { type: 'number', example: 5000, description: 'Monthly maintenance in Rs.', default: 0 },
            lightBill: { type: 'number', example: 500, description: 'Monthly light bill in Rs.', default: 0 },
            userId: { type: 'string', format: 'ObjectId' },
            tenant: { 
              type: 'string', 
              format: 'ObjectId',
              nullable: true,
              description: 'Reference to tenant if property is occupied'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PropertyRequest: {
          type: 'object',
          required: ['propertyType', 'area', 'location', 'monthlyRent'],
          properties: {
            propertyType: { 
              type: 'string', 
              enum: ['flat', 'shop', 'plot'],
              example: 'flat'
            },
            area: { type: 'number', example: 1200 },
            location: { type: 'string', example: '123 Main Street, City' },
            monthlyRent: { type: 'number', example: 25000 },
            maintenance: { type: 'number', example: 5000 },
            lightBill: { type: 'number', example: 500 }
          }
        },
        Tenant: {
          type: 'object',
          required: ['name', 'phone', 'email', 'aadhar', 'startDate', 'propertyId'],
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            name: { type: 'string', example: 'Jane Smith' },
            phone: { type: 'string', example: '9876543210' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            aadhar: { type: 'string', example: '1234-5678-9012' },
            startDate: { type: 'string', format: 'date', example: '2024-01-01' },
            propertyId: { type: 'string', format: 'ObjectId' },
            rentStatus: { 
              type: 'string', 
              enum: ['paid', 'pending'],
              example: 'pending'
            },
            maintenanceStatus: { 
              type: 'string', 
              enum: ['paid', 'pending'],
              example: 'pending'
            },
            lightBillStatus: { 
              type: 'string', 
              enum: ['paid', 'pending'],
              example: 'pending'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        TenantRequest: {
          type: 'object',
          required: ['name', 'phone', 'email', 'aadhar', 'startDate'],
          properties: {
            name: { type: 'string', example: 'Jane Smith' },
            phone: { type: 'string', example: '9876543210' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            aadhar: { type: 'string', example: '1234-5678-9012' },
            startDate: { type: 'string', format: 'date', example: '2024-01-01' }
          }
        },
        StatusUpdateRequest: {
          type: 'object',
          required: ['rentStatus'],
          properties: {
            rentStatus: { 
              type: 'string', 
              enum: ['paid', 'pending'],
              example: 'paid'
            }
          }
        },
        OverviewStats: {
          type: 'object',
          properties: {
            totalProperties: { type: 'integer', example: 50 },
            totalTenants: { type: 'integer', example: 35 },
            pendingRent: { type: 'number', example: 875000 },
            pendingMaintenance: { type: 'number', example: 175000 },
            pendingLightBill: { type: 'number', example: 17500 }
          }
        },
        MonthlyStats: {
          type: 'object',
          properties: {
            year: { type: 'integer', example: 2024 },
            month: { type: 'integer', example: 1 },
            rent: {
              type: 'object',
              properties: {
                collected: { type: 'number', example: 500000 },
                pending: { type: 'number', example: 375000 }
              }
            },
            maintenance: {
              type: 'object',
              properties: {
                collected: { type: 'number', example: 100000 },
                pending: { type: 'number', example: 75000 }
              }
            },
            lightBill: {
              type: 'object',
              properties: {
                collected: { type: 'number', example: 10000 },
                pending: { type: 'number', example: 7500 }
              }
            }
          }
        },
        YearlyStats: {
          type: 'object',
          properties: {
            year: { type: 'integer', example: 2024 },
            totalCollection: { type: 'number', example: 6000000 },
            monthlyBreakdown: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  rent: { type: 'number' },
                  maintenance: { type: 'number' },
                  lightBill: { type: 'number' },
                  total: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints (register, login, password reset)'
      },
      {
        name: 'Property',
        description: 'Property management endpoints (CRUD operations)'
      },
      {
        name: 'Tenant',
        description: 'Tenant management endpoints (CRUD operations and status updates)'
      },
      {
        name: 'Stats',
        description: 'Statistics and dashboard endpoints'
      }
    ]
  },
  apis: [
    './controllers/**/*.js',
    './routes/**/*.js',
    './server.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
