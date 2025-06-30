function middleware(req, res, next){
    const clientId = req.user.clientId; // Assuming client ID is sent in the header
    if (clientId) {
        req.clientId = clientId;
        next();
    } else {
        res.status(400).send('Client ID is required');
    }
}

module.exports = middleware;