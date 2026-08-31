// Google OAuth via Passport. This file only configures the strategy and
// how a Google profile becomes (or links to) a row in the users table.
// The HTTP routes live in routes/auth.js. Uses the shared Prisma client.

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const prisma = require("../db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    // Called after Google sends the user back. done(error, user) tells Passport
    // whether login succeeded. We never create a second PrismaClient here.
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;

        // Already linked this Google account on a previous visit.
        const byGoogleId = await prisma.user.findUnique({ where: { googleId } });
        if (byGoogleId) {
          return done(null, byGoogleId);
        }

        // Same email as an existing account → attach googleId instead of a new user.
        // Lowercase so it matches how register/login store email.
        const email = String(profile.emails[0].value).trim().toLowerCase();
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail) {
          const linked = await prisma.user.update({
            where: { id: byEmail.id },
            data: { googleId },
          });
          return done(null, linked);
        }

        // Brand-new user: no password yet (they signed in with Google).
        // city is required on the schema, so we store "" like a blank register form.
        const created = await prisma.user.create({
          data: {
            email,
            googleId,
            name: profile.displayName,
            passwordHash: null,
            city: "",
          },
        });
        return done(null, created);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// Passport stores this value on the session. We use the database user id
// (same id email/password login puts on req.session.userId).
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// On later requests, turn that stored id back into a user object for req.user.
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
