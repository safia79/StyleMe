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
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;

        const byGoogleId = await prisma.user.findUnique({ where: { googleId } });
        if (byGoogleId) {
          return done(null, byGoogleId);
        }

        const email = String(profile.emails[0].value).trim().toLowerCase();
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail) {
          const linked = await prisma.user.update({
            where: { id: byEmail.id },
            data: { googleId },
          });
          return done(null, linked);
        }

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

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
