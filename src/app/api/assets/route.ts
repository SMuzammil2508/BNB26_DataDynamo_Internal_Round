import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany();
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assets", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const asset = await prisma.asset.create({
      data: body,
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create asset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
