import { prisma } from "../prisma/prisma";
import { EnrollmentDTO } from "../dtos/Enrollments.dto";


export class EnrollmentRepository {
  async createEnrollment(enrollment: EnrollmentDTO) {
    try {
      return await prisma.enrollment.create({
        data: {
          userId: enrollment.userId,
          courseId: enrollment.courseId,
        },
      });
    } catch (error) {
      console.error("Error creating enrollment:", error);
      throw error;
    }
  }
  async removeEnrollment(userId: string, courseId: string) {
    try {
      return await prisma.enrollment.delete({
        where:{
          userId_courseId: {
            userId: userId,
            courseId: courseId,
          }
        }
      });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      throw error;
    }
  }
  async getEnrollmentsByUserId(userId: string) {
    try {
      return await prisma.enrollment.findMany({
        where: {
          userId: userId,
        },
      });
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      throw error;
    }
  }
  async exists(userId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
      },
    });
    return enrollment!==null;
  }
}
export const enrollmentRepository = new EnrollmentRepository();