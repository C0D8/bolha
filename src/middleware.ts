import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    return redirectToSignIn();
  }

  const baseUrl = req.nextUrl.origin;

  try {
    const res = await fetch(`${baseUrl}/api/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Erro ao verificar rosto registrado:", res.statusText);
      return NextResponse.redirect(new URL("/cadastro", req.url));
    }

    const data = await res.json();
    console.log(data);

    if (data.face_embeddings === false) {
      return NextResponse.redirect(new URL("/cadastro", req.url));
    }

  } catch (error) {
    console.error("Erro de rede:", error);
    return NextResponse.redirect(new URL("/cadastro", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
  ignoredRoutes: ["/api/webhooks(.*)"],
  publicRoutes: ["/"],
};
