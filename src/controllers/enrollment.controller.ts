import { Request, Response } from 'express';
import { RegisterCourseService, GetAllEnrollmentsService, verifyEnrollmentService } from '../services/enrollment.service';
export async function RegisterCourse(req: Request, res: Response) {
  // Change to JWT authentication in the future to get userId from the token instead of headers
  const userId = req.headers["x-user-id"] as string;
  const {courseId } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (!courseId) {
    return res.status(400).json({ message: "Course ID is required" });
  }
  try {
    const enrollment = await RegisterCourseService(userId, courseId);
    return res.json({
      message: 'Subject registered successfully',
      data: enrollment
    });
  } catch (error) {

    return res.status(500).json({
      message: 'Error registering subject',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
export async function AllRegisteredCourses(req: Request, res: Response) {
  // Change to JWT authentication in the future to get userId from the token instead of headers
  const userId = req.headers["x-user-id"];
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "User ID is required in the headers" });
  }
  else {
    try {
      const AllEnrollments = await GetAllEnrollmentsService(userId);
      if (AllEnrollments.length === 0) {
        return res.status(404).json({ message: "No enrollments found for this user" });
      }
      return res.json({ message: "Enrollments found", data: AllEnrollments });
    } catch (error) {
      return res.status(500).json({
        message: 'Error fetching enrollments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export async function checkEnrollment(req: Request, res: Response) {
  // Change to JWT authentication in the future to get userId from the token instead of headers
  const userId = req.headers["x-user-id"];
  const { courseId } = req.params;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "User ID is required in the headers" });
  }
  if (!courseId) {
    return res.status(400).json({ message: "Course ID is required in the parameters" });
  }
  try {
    const isEnrolled = await verifyEnrollmentService(userId, courseId);
    return res.json({ message: "Enrollment status fetched", enrolled: { isEnrolled } });
  } catch (error) {
    return res.status(500).json({
      message: 'Error verifying enrollment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}