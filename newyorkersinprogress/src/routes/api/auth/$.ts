import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth.server";

// Better Auth's endpoints: sign-up, sign-in, Google callback, session, sign-out.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});
