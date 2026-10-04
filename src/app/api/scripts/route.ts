import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHooks } from "@/lib/ai/services";

export async function GET() {
  try {
    const scripts = await prisma.script.findMany({
      orderBy: { createdAt: "desc" },
    });
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
    const projectId = body.projectId || "p1";

    await prisma.project.upsert({
      where: { id: projectId },
      update: {},
      create: { id: projectId, title: "Default Project" },
    });

    let hooks = body.hooks;
    // When hooks are not provided, or generateHooks is requested, invoke generateHooks from AI services
    if (!hooks || (Array.isArray(hooks) && hooks.length === 0) || body.generateHooks) {
      const promptContent = body.content || body.title || "Short-form video script";
      const generated = await generateHooks(promptContent);
      hooks = generated;
    }

    const script = await prisma.script.create({
      data: {
        projectId,
        title: body.title || "Untitled Script",
        content: body.content || "",
        hooks: typeof hooks === "string" ? hooks : JSON.stringify(hooks),
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create script", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
