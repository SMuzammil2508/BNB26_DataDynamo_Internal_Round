import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestClips } from "@/lib/ai/services";

export async function GET() {
  try {
    const clips = await prisma.clip.findMany({
      orderBy: { createdAt: "desc" },
    });
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
    const body = await request.json().catch(() => ({}));
    const projectId = body.projectId || "p1";

    await prisma.project.upsert({
      where: { id: projectId },
      update: {},
      create: { id: projectId, title: "Default Project" },
    });

    // If explicit clip parameters provided without AI generation request
    if (body.title && body.startTime !== undefined && body.endTime !== undefined && !body.generateAI) {
      const clip = await prisma.clip.create({
        data: {
          projectId,
          title: body.title,
          videoUrl: body.videoUrl || "https://placehold.co/400x700/0f172a/fff?text=Clip",
          startTime: typeof body.startTime === "string" ? parseFloat(body.startTime) : body.startTime,
          endTime: typeof body.endTime === "string" ? parseFloat(body.endTime) : body.endTime,
          platform: body.platform || "SHORTS",
        },
      });
      return NextResponse.json(clip, { status: 201 });
    }

    // Retrieve latest script content if available
    const latestScript = await prisma.script.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    const scriptContent = body.scriptContent || latestScript?.content || "Viral short form video content strategy.";
    const transcript = body.transcript || "00:00 Introduction 00:15 Main tip and breakdown 00:45 Call to action 01:00 Outro";

    // Invoke suggestClips from AI services
    const suggestions = await suggestClips(scriptContent, transcript);
    const topSuggestion = suggestions[0] || {
      title: "Viral Hook Clip",
      startSeconds: 0,
      endSeconds: 30,
      confidence: 0.9,
    };

    const platforms: Array<"SHORTS" | "REELS" | "TIKTOK"> = ["SHORTS", "REELS", "TIKTOK"];
    const chosenPlatform = (body.platform && ["SHORTS", "REELS", "TIKTOK"].includes(body.platform))
      ? body.platform
      : platforms[Math.floor(Math.random() * platforms.length)];

    const clip = await prisma.clip.create({
      data: {
        projectId,
        title: topSuggestion.title || "AI Highlight Clip",
        videoUrl: body.videoUrl || `https://placehold.co/400x700/0f172a/fff?text=${encodeURIComponent(topSuggestion.title || "Clip")}`,
        startTime: topSuggestion.startSeconds ?? 0,
        endTime: topSuggestion.endSeconds ?? 30,
        platform: chosenPlatform,
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
