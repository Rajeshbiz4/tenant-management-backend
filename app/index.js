import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../../config/swagger.js"; // update path
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// expose swagger JSON explicitly
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type','application/json');
  res.send(swaggerSpec);
});

// swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: '/api/swagger.json' }
}));

app.get("/", (req, res) => {
  res.send("Tenant Management System API Running");
});

// Export as Vercel serverless function
export default app;
