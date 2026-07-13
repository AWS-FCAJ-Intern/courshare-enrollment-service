"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = getHealthStatus;
async function getHealthStatus(req, res) {
    console.log('Health check endpoint called', req.method, req.url);
    return res.json({
        service: 'enrollment-service',
        status: 'UP'
    });
}
;
