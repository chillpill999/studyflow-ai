import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // Attach the Google ID (sub) to the session if needed
        (session.user as Record<string, unknown>).id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
