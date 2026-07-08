export const getHealthStatus = (req, res) => {
    res.json({
        service: 'enrollment-service',
        status: 'UP'
    });
};
