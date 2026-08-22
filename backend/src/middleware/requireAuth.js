// FR-02: User Login & Session
// Use this on later feature API routes (wardrobe, outfits, etc.)
// so they reject requests that do not have a valid session.

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Please log in to continue.",
    });
  }

  next();
}

module.exports = requireAuth;
