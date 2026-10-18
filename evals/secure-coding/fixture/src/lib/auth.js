// Pone req.user = { id, role } a partir de la sesión. Rechaza con 401 si no hay sesión.
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "No autenticado" });
  next();
}

module.exports = { requireAuth };
