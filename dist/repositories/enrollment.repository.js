"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentRepository = exports.EnrollmentRepository = void 0;
const prisma_1 = require("../prisma/prisma");
class EnrollmentRepository {
    async createEnrollment(enrollment) {
        try {
            return await prisma_1.prisma.enrollment.create({
                data: {
                    userId: enrollment.userId,
                    courseId: enrollment.courseId,
                },
            });
        }
        catch (error) {
            console.error("Error creating enrollment:", error);
            throw error;
        }
    }
    async removeEnrollment(userId, courseId) {
        try {
            return await prisma_1.prisma.enrollment.delete({
                where: {
                    userId_courseId: {
                        userId: userId,
                        courseId: courseId,
                    }
                }
            });
        }
        catch (error) {
            console.error("Error removing enrollment:", error);
            throw error;
        }
    }
    async getEnrollmentsByUserId(userId) {
        try {
            return await prisma_1.prisma.enrollment.findMany({
                where: {
                    userId: userId,
                },
            });
        }
        catch (error) {
            console.error("Error fetching enrollments:", error);
            throw error;
        }
    }
    async exists(userId, courseId) {
        const enrollment = await prisma_1.prisma.enrollment.findFirst({
            where: {
                userId,
                courseId,
            },
        });
        return enrollment !== null;
    }
}
exports.EnrollmentRepository = EnrollmentRepository;
exports.enrollmentRepository = new EnrollmentRepository();
