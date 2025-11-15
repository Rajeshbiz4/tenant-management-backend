const swaggerJSDoc = require('swagger-jsdoc');
const pkg = require('../package.json');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:  'Tenant Management API',
      version: pkg.version || '1.0.0',
      description: pkg.description || 'Complete API for managing properties, tenants, units and rental operations',
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
          description: 'JWT token for authentication'
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
            size: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 }
          }
        },
        User: {
          type: 'object',
          required: ['firstName', 'lastName', 'mobile', 'userType'],
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            mobile: { type: 'string', example: '9876543210' },
            userType: { 
              type: 'string', 
              enum: ['tenant', 'owner', 'admin'],
              example: 'tenant'
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Property: {
          type: 'object',
          required: ['buildingName', 'buildingAddress', 'pincode', 'state', 'userId'],
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            buildingName: { type: 'string', example: 'Sunrise Apartments' },
            buildingAddress: { type: 'string', example: '123 Main St' },
            pincode: { type: 'string', example: '560001' },
            state: { type: 'string', example: 'Karnataka' },
            owner: { type: 'string' },
            imageUrl: { type: 'string', format: 'uri' },
            createdBy: { type: 'string', format: 'ObjectId' },
            counts: {
              type: 'object',
              properties: {
                flats: { type: 'integer', example: 24 },
                shops: { type: 'integer', example: 2 },
                halls: { type: 'integer', example: 1 },
                plots: { type: 'integer', example: 0 }
              }
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Unit: {
          type: 'object',
          required: ['propertyId', 'unitType', 'flatNo', 'area', 'rent'],
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            propertyId: { type: 'string', format: 'ObjectId', example: '650f1a2b3c4d5e6f7a8b9c0d' },
            unitType: { 
              type: 'string', 
              enum: ['flat', 'shop', 'hall', 'plot'],
              example: 'flat'
            },
            flatNo: { type: 'string', example: '101' },
            area: { type: 'number', example: 1200, description: 'Area in sq.ft' },
            rent: { type: 'number', example: 25000, description: 'Monthly rent in Rs.' },
            description: { type: 'string', example: '3 BHK apartment with balcony' },
            rentalStatus: { 
              type: 'string', 
              enum: ['available', 'rented'],
              example: 'available'
            },
            maintenance: { type: 'number', example: 5000, description: 'Monthly maintenance in Rs.' },
            lightBill: { type: 'number', example: 500, description: 'Monthly light bill in Rs.' },
            rentObject: {
              type: 'object',
              properties: {
                tenantId: { type: 'string', format: 'ObjectId' },
                tenantName: { type: 'string' },
                rentStartDate: { type: 'string', format: 'date' },
                rentEndDate: { type: 'string', format: 'date' },
                securityDeposit: { type: 'number' }
              }
            },
            features: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['balcony', 'parking', 'garden']
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      {
        name: 'User',
        description: 'User management endpoints (create, authenticate, update, delete)'
      },
      {
        name: 'Property',
        description: 'Property management endpoints (create, list, get, update, delete)'
      },
      {
        name: 'Unit',
        description: 'Unit/Flat management endpoints (create, list, get, update, delete)'
      }
    ]
  },
  apis: [
    './modules/**/*.js',
    './server.js'
  ]
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;