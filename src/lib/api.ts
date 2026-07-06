import { NextResponse } from "next/server";

export function getRequestOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export function getHostOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (!host) return null;
  return `${proto}://${host}`;
}

export function ensureSameOrigin(req: Request) {
  const requestOrigin = getRequestOrigin(req);
  const hostOrigin = getHostOrigin(req);

  if (!requestOrigin || !hostOrigin || requestOrigin === hostOrigin) {
    return null;
  }

  return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
}

export async function getJsonBody<T>(req: Request) {
  return (await req.json()) as T;
}
