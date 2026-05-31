// middleware soloOperatori.js
const operatoriAuth = (req, res, next) => {
    if (req.loggedUser.ruolo !== 'operatore') {
        console.log('accesso negato');
        return res.status(403).json({ error: 'Accesso riservato agli operatori' });
    }
    next();
};

module.exports = operatoriAuth;