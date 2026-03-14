import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "vibedex_session";

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasCookie = request.cookies.get(COOKIE_NAME)?.value;

  if (path.startsWith("/dashboard") && !hasCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }

  if (path === "/login" && hasCookie) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next({ request });
}
