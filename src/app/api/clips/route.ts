import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clips = await prisma.clip.findMany();
    return NextResponse.json(clips);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch clips", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clip = await prisma.clip.create({
      data: {
        ...body,
        startTime: typeof body.startTime === "string" ? parseFloat(body.startTime) : body.startTime,
        endTime: typeof body.endTime === "string" ? parseFloat(body.endTime) : body.endTime,
      },
    });
    return NextResponse.json(clip, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create clip", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
