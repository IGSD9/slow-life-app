import { NextResponse } from "next/server";
import { getAccountSettings, updateAccountEmail } from "@/lib/actions/settings";

export async function GET() {
  const settings = await getAccountSettings();
  if (!settings) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await updateAccountEmail(body.newEmail ?? "", body.password ?? "");
  if (!result.success) {
    const status =
      result.error === "UNAUTHORIZED"
        ? 401
        : result.error === "INVALID_PASSWORD"
          ? 403
          : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
