// middleware soloOperatori.js
const operatoriAuth = (req, res, next) => {
    if (req.loggedUser.ruolo !== 'operatore') {
        return res.status(403).json({ error: 'Accesso riservato agli operatori' });
    }
    next();
};

export default operatoriAuth;