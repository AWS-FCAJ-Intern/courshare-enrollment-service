"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterCourseService = RegisterCourseService;
exports.RemoveEnrollmentService = RemoveEnrollmentService;
exports.GetAllEnrollmentsService = GetAllEnrollmentsService;
exports.verifyEnrollmentService = verifyEnrollmentService;
const enrollment_event_1 = require("../events/enrollment.event");
const sqs_publisher_1 = require("../messaging/sqs.publisher");
const enrollment_repository_1 = require("../repositories/enrollment.repository");
const app_errors_1 = require("../errors/app-errors");
function wrapInfraError(error, context) {
    // Nếu đã là lỗi đã phân loại (throw chủ động ở service) thì giữ nguyên
    if (error instanceof app_errors_1.PermanentError || error instanceof app_errors_1.TransientError) {
        return error;
    }
    // Lỗi hạ tầng biết trước (DB/network) → Transient
    if (error?.code && app_errors_1.TRANSIENT_DB_ERROR_CODES.has(error.code)) {
        return new app_errors_1.TransientError(`${context}: ${error.message}`, error);
    }
    // Postgres unique_violation → xử lý riêng ở nơi gọi, không nên rơi vào đây
    // Lỗi không xác định → an toàn hơn là coi như Transient, để retry thay vì mất message
    return new app_errors_1.TransientError(`${context}`, error);
}
async function RegisterCourseService(userId, courseId) {
    if (!userId) {
        throw new app_errors_1.PermanentError(`Invalid payload: userId=${userId}`);
    }
    if (!courseId) {
        throw new app_errors_1.PermanentError(`Invalid payload: courseId=${courseId}`);
    }
    let isAlreadyEnrolled;
    try {
        isAlreadyEnrolled = await enrollment_repository_1.enrollmentRepository.exists(userId, courseId);
    }
    catch (error) {
        throw wrapInfraError(error, "Failed to check existing enrollment");
    }
    if (isAlreadyEnrolled) {
        console.warn(`User ${userId} already enrolled in course ${courseId}, skipping`);
        return await enrollment_repository_1.enrollmentRepository.getEnrollmentsByUserId(userId);
    }
    let enrollment;
    try {
        enrollment = await enrollment_repository_1.enrollmentRepository.createEnrollment({ userId, courseId });
    }
    catch (error) {
        // Race condition: 2 message xử lý gần như đồng thời cùng insert
        if (error.code === "23505") { // unique_violation (Postgres)
            console.warn("Enrollment already exists, treating as success");
            return await enrollment_repository_1.enrollmentRepository.getEnrollmentsByUserId(userId);
        }
        throw wrapInfraError(error, "Failed to create enrollment");
    }
    try {
        await sqs_publisher_1.sqsPublisher.EnrollmentPublisher({
            eventType: enrollment_event_1.EnrollmentEventType.COURSE_CREATED,
            payload: {
                enrollmentId: enrollment.id,
                userId: enrollment.userId,
                courseId: enrollment.courseId,
            },
            occurredAt: new Date().toISOString(),
        });
    }
    catch (error) {
        // Enrollment đã tạo thành công nhưng publish thất bại → lỗi tạm thời,
        // nên để consumer retry toàn bộ message (idempotent nhờ check exists() ở trên)
        throw wrapInfraError(error, "Failed to publish enrollment created event");
    }
    return enrollment;
}
async function RemoveEnrollmentService(userId, courseId) {
    if (!userId) {
        throw new app_errors_1.PermanentError(`Invalid payload: userId=${userId}`);
    }
    if (!courseId) {
        throw new app_errors_1.PermanentError(`Invalid payload: courseId=${courseId}`);
    }
    let isEnrolled;
    try {
        isEnrolled = await enrollment_repository_1.enrollmentRepository.exists(userId, courseId);
    }
    catch (error) {
        throw wrapInfraError(error, "Failed to check enrollment before removal");
    }
    if (!isEnrolled) {
        // Đã bị xoá trước đó (event trùng) → coi như đã xử lý xong, không phải lỗi
        console.warn(`Enrollment not found for user ${userId}, course ${courseId} — already removed?`);
        return null;
    }
    let enrollmentRemoved;
    try {
        enrollmentRemoved = await enrollment_repository_1.enrollmentRepository.removeEnrollment(userId, courseId);
    }
    catch (error) {
        throw wrapInfraError(error, "Failed to remove enrollment");
    }
    try {
        await sqs_publisher_1.sqsPublisher.EnrollmentPublisher({
            eventType: enrollment_event_1.EnrollmentEventType.COURSE_REMOVED,
            payload: {
                enrollmentId: enrollmentRemoved.id,
                userId: enrollmentRemoved.userId,
                courseId: enrollmentRemoved.courseId,
            },
            occurredAt: new Date().toISOString(),
        });
    }
    catch (error) {
        throw wrapInfraError(error, "Failed to publish enrollment removed event");
    }
    return enrollmentRemoved;
}
async function GetAllEnrollmentsService(userId) {
    if (!userId) {
        throw new app_errors_1.PermanentError(`Invalid payload: userId=${userId}`);
    }
    try {
        const enrollments = await enrollment_repository_1.enrollmentRepository.getEnrollmentsByUserId(userId);
        return enrollments ?? [];
    }
    catch (error) {
        throw wrapInfraError(error, "Failed to fetch enrollments");
    }
}
async function verifyEnrollmentService(userId, courseId) {
    if (!userId) {
        throw new app_errors_1.PermanentError(`Invalid payload: userId=${userId}`);
    }
    if (!courseId) {
        throw new app_errors_1.PermanentError(`Invalid payload: courseId=${courseId}`);
    }
    try {
        const enrolled = await enrollment_repository_1.enrollmentRepository.exists(userId, courseId);
        return { enrolled };
    }
    catch (error) {
        throw wrapInfraError(error, "Failed to verify enrollment");
    }
}
