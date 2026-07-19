"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const enrollmentRoutes = (0, express_1.Router)();
enrollmentRoutes.post('/', enrollment_controller_1.RegisterCourse);
enrollmentRoutes.get('/me', enrollment_controller_1.AllRegisteredCourses);
enrollmentRoutes.get('/:courseId/check', enrollment_controller_1.checkEnrollment);
exports.default = enrollmentRoutes;
