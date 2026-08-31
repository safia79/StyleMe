// FR-02: User Login & Session
// Use this on later feature API routes (wardrobe, outfits, etc.)
// so they reject requests that do not have a valid session.
//
// Express middleware: if this function calls next(), the request continues
// to the route handler. If it sends a response, the handler never runs.
// Email/password and Google login both store the database user id on
// req.session.userId (not req.user).

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Please log in to continue.",
    });
  }

  next();
}

module.exports = requireAuth;
