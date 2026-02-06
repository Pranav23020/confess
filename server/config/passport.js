const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
                proxy: true // Important for cloud deployments/reverse proxies
            },
            async (accessToken, refreshToken, profile, done) => {
                const newUser = {
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    avatar: profile.photos[0].value
                };

                try {
                    // Check if user exists
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        return done(null, user);
                    } else {
                        // Check if user exists by email (to merge accounts)
                        user = await User.findOne({ email: profile.emails[0].value });

                        if (user) {
                            // Update existing user with googleId
                            user.googleId = profile.id;
                            user.avatar = user.avatar || profile.photos[0].value;
                            await user.save();
                            return done(null, user);
                        }

                        // Create new user
                        user = await User.create(newUser);
                        return done(null, user);
                    }
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
