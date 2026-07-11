import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from "./routes/health.routes";
import enrollmentRoutes from "./routes/enrollment.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 8084;

app.use(cors());
app.use(express.json());

app.use('/', healthRoutes);
app.use('/enrollments', enrollmentRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
