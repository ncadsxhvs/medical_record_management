import 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user object to include the user's ID from your database.
   */
  interface Session {
    user: {
      id: string; // Add your custom property here
    } & DefaultSession['user'];
  }

  /**
   * Extends the built-in user object.
   */
  interface User {
    id: string; // Add your custom property here
  }
}
