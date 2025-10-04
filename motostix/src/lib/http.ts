import { NextResponse } from "next/server";

type Json = Record<string, unknown> | Array<unknown> | null;

export function ok(data: Json, init: ResponseInit = {}) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: "bad_request", message, details }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ ok: false, error: "unauthorized", message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ ok: false, error: "forbidden", message }, { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ ok: false, error: "not_found", message }, { status: 404 });
}

export function serverError(message = "Internal server error", details?: unknown) {
  return NextResponse.json({ ok: false, error: "server_error", message, details }, { status: 500 });
}
