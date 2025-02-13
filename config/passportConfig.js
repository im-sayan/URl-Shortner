const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/user");
const axios = require("axios");
require("dotenv").config();



passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_REDIRECT_URI,
            scope: ["profile", "email"], 
        },
        async (accessToken, refreshToken, profile, done) => {
            try {

                let email = profile.emails?.[0]?.value || ""; // ✅ Default email handling

                // ✅ Fetch email manually if missing
                if (!email) {
                    const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    email = response.data.email || "";
                }

                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: email,
                        avatar: profile.photos?.[0]?.value || "",
                    });
                    await user.save();
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// ✅ Fix serialization & deserialization
passport.serializeUser((user, done) => {
    done(null, user._id); // Use MongoDB _id
});

passport.deserializeUser(async (id, done) => {
    try {
        
        const user = await User.findById({_id: id});
        if (!user) {
            return done(new Error("User not found"), null);
        }
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});
