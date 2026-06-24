import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_I || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Simple demo authentication fallback
        if (credentials?.email === "demo@studyflow.ai" && credentials?.password === "password") {
          return { id: "demo-user", name: "Demo Scholar", email: "demo@studyflow.ai" };
        }
        // Fallback for onboarding validation or custom email logins
        return {
          id: `user-${Date.now()}`,
          name: credentials?.email?.split('@')[0] || "Student",
          email: credentials?.email || "student@studyflow.ai"
        };
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.sub || token.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
});

export { handler as GET, handler as POST };
