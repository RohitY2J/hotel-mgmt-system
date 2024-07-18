exports.clientIDMiddleware = function(req, res, next){
    const clientID = req.get('X-Client-ID'); // Assuming client ID is sent in the header
    if (clientID) {
        req.clientID = clientID;
        next();
    } else {
        res.status(400).send('Client ID is required');
    }
};