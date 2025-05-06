import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/midia-pipe', '/'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    return redirectToSignIn();
  }


  try {
    const res = await fetch(`/api/faces/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Erro ao verificar rosto registrado:", res.statusText);
      return NextResponse.redirect(new URL("/", req.url));
    }

    const data = await res.json();
    console.log(data);

    if (data.isRegistered === false) {
      return NextResponse.redirect(new URL("/register-face", req.url));
    }

  } catch (error) {
    console.error("Erro de rede:", error);
    return NextResponse.redirect(new URL("/", req.url));
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
