import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Never return credential values from this endpoint; only report whether they exist.
export async function GET() {
  const required = {
    appId: Boolean(process.env.META_APP_ID),
    appSecret: Boolean(process.env.META_APP_SECRET),
    redirectUri: Boolean(process.env.META_REDIRECT_URI),
  };

  const configured = Object.values(required).every(Boolean);
  return NextResponse.json(
    {
      provider: "meta",
      configured,
      credentials: required,
      nextStep: configured ? "oauth_setup" : "create_meta_app_and_add_environment_variables",
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
