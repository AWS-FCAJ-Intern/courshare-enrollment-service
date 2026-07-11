"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("../controllers/health.controller");
const healthRoutes = (0, express_1.Router)();
healthRoutes.get('/', health_controller_1.getHealthStatus);
exports.default = healthRoutes;
