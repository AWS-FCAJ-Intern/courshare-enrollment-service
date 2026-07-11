import { Router } from 'express';
import { RegisterCourse,AllRegisteredCourses, checkEnrollment  } from '../controllers/enrollment.controller';

const enrollmentRoutes = Router();

enrollmentRoutes.post('/', RegisterCourse);
enrollmentRoutes.get ('/me', AllRegisteredCourses);
enrollmentRoutes.get('/:courseId/check', checkEnrollment);
export default enrollmentRoutes;
