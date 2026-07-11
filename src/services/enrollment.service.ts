import { EnrollmentEventType } from "../events/enrollment.event";
import { sqsPublisher } from "../messaging/sqs.publisher";
import { enrollmentRepository } from "../repositories/enrollment.repository";

export async function RegisterCourseService(userID: string, courseId: string) {
  try {
    const isAlreadyEnrolled = await enrollmentRepository.exists(userID, courseId);
    if (isAlreadyEnrolled!=null) {
      throw new Error("User is already enrolled in this course");
    }
    const enrollment = await enrollmentRepository.createEnrollment({ userId: userID, courseId });
    // Publish an event to the message broker to notify other services about the new enrollment
    await sqsPublisher.EnrollmentPublisher({
      eventType: EnrollmentEventType.COURSE_CREATED,
      payload: {
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
      },
      occurredAt: new Date().toISOString(),
    });
    return enrollment;
  } catch (error) {
    console.error("Error creating enrollment:", error);
    throw error;
  }
}

export async function RemoveEnrollmentService(userId: string, courseId: string) {
  try {
    const isEnrolled = await enrollmentRepository.exists(userId, courseId);
    if (!isEnrolled) {
      throw new Error("User is not enrolled in this course");
    }
    const enrollmentRemoved = await enrollmentRepository.removeEnrollment(userId, courseId);
    // Publish an event to the message broker to notify other services about the removed enrollment
    await sqsPublisher.EnrollmentPublisher({
      eventType: EnrollmentEventType.COURSE_REMOVED,
      payload: {
        enrollmentId: enrollmentRemoved.id,
        userId: enrollmentRemoved.userId,
        courseId: enrollmentRemoved.courseId,
      },
      occurredAt: new Date().toISOString(),
    });
    return enrollmentRemoved;
  } catch (error) {
    console.error("Error removing enrollment:", error);
    throw error;
  }
}

export async function GetAllEnrollmentsService(userId: string) {
  try {
    return await enrollmentRepository.getEnrollmentsByUserId(userId);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    throw error;
  }
}

export async function verifyEnrollmentService(
  userId: string,
  courseId: string
) {
  try {
    const enrollment = await enrollmentRepository.exists(userId, courseId);

    return {
      enrolled: enrollment !== null,
    };
  } catch (error) {
    console.error("Error verifying enrollment:", error);
    throw error;
  }
}