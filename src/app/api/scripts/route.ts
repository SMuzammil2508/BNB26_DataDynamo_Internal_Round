import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const scripts = await prisma.script.findMany();
    return NextResponse.json(scripts);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scripts", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = {
      ...body,
      hooks: typeof body.hooks === "object" ? JSON.stringify(body.hooks) : (body.hooks ?? ""),
    };
    const script = await prisma.script.create({
      data,
    });
    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create script", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
