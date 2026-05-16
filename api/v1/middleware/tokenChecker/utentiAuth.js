const jwt = require('jsonwebtoken');

const tokenChecker = function (req, res, next) {

    // controlla l'intestazione o i parametri URL o i parametri POST per il token
    var token = req.headers['authorization']?.split(' ')[1]
        || req.headers['x-access-token']
        || req.query.token;
    if (!token) {
        console.log('token mancante');
        return res.status(401).send({
            success: false,
            message: 'Trovato nessun token'
        });
    }
    // controllo del token se valido
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            console.log('token non valido')
            return res.status(403).send({
                success: false,
                message: 'Token non verificato'
            });
        } else {
            req.loggedUser = decoded;
            next();
        }
    });

};

module.exports = tokenChecker;