import { EnrollmentEventType } from "../events/enrollment.event";
import { sqsPublisher } from "../messaging/sqs.publisher";
import { enrollmentRepository } from "../repositories/enrollment.repository";
import { PermanentError, TransientError, TRANSIENT_DB_ERROR_CODES } from "../errors/app-errors";


function wrapInfraError(error: any, context: string): Error {
  // Nếu đã là lỗi đã phân loại (throw chủ động ở service) thì giữ nguyên
  if (error instanceof PermanentError || error instanceof TransientError) {
    return error;
  }
  // Lỗi hạ tầng biết trước (DB/network) → Transient
  if (error?.code && TRANSIENT_DB_ERROR_CODES.has(error.code)) {
    return new TransientError(`${context}: ${error.message}`, error);
  }
  // Postgres unique_violation → xử lý riêng ở nơi gọi, không nên rơi vào đây
  // Lỗi không xác định → an toàn hơn là coi như Transient, để retry thay vì mất message
  return new TransientError(`${context}`, error);
}

export async function RegisterCourseService(userId: string, courseId: string) {
  if (!userId) {
    throw new PermanentError(`Invalid payload: userId=${userId}`);
  }
  if (!courseId) {
    throw new PermanentError(`Invalid payload: courseId=${courseId}`);
  }

  let isAlreadyEnrolled: boolean;
  try {
    isAlreadyEnrolled = await enrollmentRepository.exists(userId, courseId);
  } catch (error) {
    throw wrapInfraError(error, "Failed to check existing enrollment");
  }

  if (isAlreadyEnrolled) {
    console.warn(`User ${userId} already enrolled in course ${courseId}, skipping`);
    return await enrollmentRepository.getEnrollmentsByUserId(userId);
  }

  let enrollment;
  try {
    enrollment = await enrollmentRepository.createEnrollment({ userId, courseId });
  } catch (error: any) {
    // Race condition: 2 message xử lý gần như đồng thời cùng insert
    if (error.code === "23505") { // unique_violation (Postgres)
      console.warn("Enrollment already exists, treating as success");
      return await enrollmentRepository.getEnrollmentsByUserId(userId);
    }
    throw wrapInfraError(error, "Failed to create enrollment");
  }

  try {
    await sqsPublisher.EnrollmentPublisher({
      eventType: EnrollmentEventType.COURSE_CREATED,
      payload: {
        enrollmentId: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
      },
      occurredAt: new Date().toISOString(),
    });
  } catch (error) {
    // Enrollment đã tạo thành công nhưng publish thất bại → lỗi tạm thời,
    // nên để consumer retry toàn bộ message (idempotent nhờ check exists() ở trên)
    throw wrapInfraError(error, "Failed to publish enrollment created event");
  }

  return enrollment;
}

export async function RemoveEnrollmentService(userId: string, courseId: string) {
  if (!userId) {
    throw new PermanentError(`Invalid payload: userId=${userId}`);
  }
  if (!courseId) {
    throw new PermanentError(`Invalid payload: courseId=${courseId}`);
  }

  let isEnrolled: boolean;
  try {
    isEnrolled = await enrollmentRepository.exists(userId, courseId);
  } catch (error) {
    throw wrapInfraError(error, "Failed to check enrollment before removal");
  }

  if (!isEnrolled) {
    // Đã bị xoá trước đó (event trùng) → coi như đã xử lý xong, không phải lỗi
    console.warn(`Enrollment not found for user ${userId}, course ${courseId} — already removed?`);
    return null;
  }

  let enrollmentRemoved;
  try {
    enrollmentRemoved = await enrollmentRepository.removeEnrollment(userId, courseId);
  } catch (error) {
    throw wrapInfraError(error, "Failed to remove enrollment");
  }

  try {
    await sqsPublisher.EnrollmentPublisher({
      eventType: EnrollmentEventType.COURSE_REMOVED,
      payload: {
        enrollmentId: enrollmentRemoved.id,
        userId: enrollmentRemoved.userId,
        courseId: enrollmentRemoved.courseId,
      },
      occurredAt: new Date().toISOString(),
    });
  } catch (error) {
    throw wrapInfraError(error, "Failed to publish enrollment removed event");
  }

  return enrollmentRemoved;
}

export async function GetAllEnrollmentsService(userId: string) {
  if (!userId) {
    throw new PermanentError(`Invalid payload: userId=${userId}`);
  }

  try {
    const enrollments = await enrollmentRepository.getEnrollmentsByUserId(userId);
    return enrollments ?? [];
  } catch (error) {
    throw wrapInfraError(error, "Failed to fetch enrollments");
  }
}

export async function verifyEnrollmentService(userId: string, courseId: string) {
  if (!userId) {
    throw new PermanentError(`Invalid payload: userId=${userId}`);
  }
  if (!courseId) {
    throw new PermanentError(`Invalid payload: courseId=${courseId}`);
  }

  try {
    const enrolled = await enrollmentRepository.exists(userId, courseId);
    return { enrolled };
  } catch (error) {
    throw wrapInfraError(error, "Failed to verify enrollment");
  }
}