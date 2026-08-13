import { auth } from "@/auth";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET || "super-secret-nextauth-token-key-change-me-in-production";
  
  // Sign token formatted for Go AuthMiddleware Claims
  const token = jwt.sign(
    {
      id: session.user.id,
      email: session.user.email,
      householdId: session.user.householdId || "",
    },
    secret,
    { algorithm: "HS256", expiresIn: "30d" }
  );

  return NextResponse.json({ token });
}
