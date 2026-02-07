const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
                proxy: true // Important for cloud deployments/reverse proxies
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user exists by googleId
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists by email - assign googleId only if password exists
                    user = await User.findOne({ email: profile.emails[0].value }).select('+password');
                    
                    if (user && user.password) {
                        // User registered with email/password, assign googleId
                        user.googleId = profile.id;
                        user.avatar = user.avatar || profile.photos[0].value;
                        await user.save();
                        return done(null, user);
                    }

                    // No existing user - store profile temporarily for registration
                    // Return partial profile for user to complete registration
                    const tempUser = {
                        email: profile.emails[0].value,
                        displayName: profile.displayName,
                        googleId: profile.id,
                        avatar: profile.photos[0]?.value || ''
                    };
                    return done(null, tempUser);
                } catch (err) {
                    console.error(err);
                    return done(err, null);
                }
            }
        )
    );

    // Serialization for sessions
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
