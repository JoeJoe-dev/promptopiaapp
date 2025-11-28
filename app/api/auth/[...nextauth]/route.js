import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDB } from "@utils/database";
import User from "@models/user";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async session({ session }) {
      console.log("🔵 SESSION CALLBACK TRIGGERED");

      try {
        console.log("Session user email:", session.user.email);

        const sessionUser = await User.findOne({
          email: session.user.email,
        });

        if (!sessionUser) {
          console.log("❌ No user found in DB for session");
          return session;
        }

        console.log("✅ User found for session:", sessionUser._id.toString());
        session.user.id = sessionUser._id.toString();

        return session;
      } catch (error) {
        console.error("❌ SESSION ERROR:", error);
        return session;
      }
    },

    async signIn({ profile }) {
      console.log("🟡 SIGN-IN CALLBACK HIT");
      console.log("Google Profile Received:", profile);

      try {
        console.log("🔄 Connecting to database...");
        await connectToDB();
        console.log("✅ Database connected successfully");

        console.log("🔍 Checking if user exists...");
        const userExists = await User.findOne({
          email: profile.email,
        });

        if (userExists) {
          console.log("🟢 User already exists:", userExists.email);
        } else {
          console.log("🆕 Creating new user...");

          await User.create({
            email: profile.email,
            username: profile.name.replace(" ", "").toLowerCase(),
            image: profile.picture,
          });

          console.log("✅ New user created successfully");
        }

        return true;
      } catch (error) {
        console.error("❌ SIGN-IN ERROR:", error);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
