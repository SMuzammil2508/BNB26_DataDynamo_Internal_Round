import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
    });
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
    const projectId = body.projectId || "p1";

    await prisma.project.upsert({
      where: { id: projectId },
      update: {},
      create: { id: projectId, title: "Default Project" },
    });

    const asset = await prisma.asset.create({
      data: {
        projectId,
        name: body.name || "Untitled Asset",
        type: body.type || "VIDEO",
        url: body.url || "https://placehold.co/600x400/1e293b/fff?text=Asset",
        duration: body.duration !== undefined && body.duration !== null ? parseFloat(body.duration) : null,
      },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create asset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
