export enum EnrollmentEventType {
  COURSE_CREATED = "enrollment.created",
  COURSE_REMOVED = "enrollment.removed",
}

export interface EnrollmentEventPayload {
  enrollmentId: string;
  userId: string;
  courseId: string;
}

export interface EnrollmentEvent {
  eventType: EnrollmentEventType;
  payload: EnrollmentEventPayload;
  occurredAt: string;
}