"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterCourseService = RegisterCourseService;
exports.RemoveEnrollmentService = RemoveEnrollmentService;
exports.GetAllEnrollmentsService = GetAllEnrollmentsService;
exports.verifyEnrollmentService = verifyEnrollmentService;
const enrollment_repository_1 = require("../repositories/enrollment.repository");
async function RegisterCourseService(userID, courseId) {
    try {
        const isAlreadyEnrolled = await enrollment_repository_1.enrollmentRepository.exists(userID, courseId);
        if (isAlreadyEnrolled != null) {
            throw new Error("User is already enrolled in this course");
        }
        const enrollment = await enrollment_repository_1.enrollmentRepository.createEnrollment({ userId: userID, courseId });
        // Publish an event to the message broker to notify other services about the new enrollment
        return enrollment;
    }
    catch (error) {
        console.error("Error creating enrollment:", error);
        throw error;
    }
}
async function RemoveEnrollmentService(userId, courseId) {
    try {
        const isEnrolled = await enrollment_repository_1.enrollmentRepository.exists(userId, courseId);
        if (!isEnrolled) {
            throw new Error("User is not enrolled in this course");
        }
        return await enrollment_repository_1.enrollmentRepository.removeEnrollment(userId, courseId);
    }
    catch (error) {
        console.error("Error removing enrollment:", error);
        throw error;
    }
}
async function GetAllEnrollmentsService(userId) {
    try {
        return await enrollment_repository_1.enrollmentRepository.getEnrollmentsByUserId(userId);
    }
    catch (error) {
        console.error("Error fetching enrollments:", error);
        throw error;
    }
}
async function verifyEnrollmentService(userId, courseId) {
    try {
        const enrollment = await enrollment_repository_1.enrollmentRepository.exists(userId, courseId);
        return {
            enrolled: enrollment !== null,
        };
    }
    catch (error) {
        console.error("Error verifying enrollment:", error);
        throw error;
    }
}
