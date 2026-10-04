import fs from "node:fs";
import path from "node:path";
import { analyzeVideo, runCreatorPipeline } from "../src/lib/ai/services";

async function main() {
  const videoArg = process.argv[2];

  console.log("=== CreatorAI Video E2E Pipeline Script ===");

  if (!videoArg) {
    console.log("No video path provided in process.argv[2]. Running default fallback verification.");
  }

  const resolvedPath = videoArg ? path.resolve(videoArg) : null;
  const exists = resolvedPath ? fs.existsSync(resolvedPath) : false;

  console.log(`Target Video: ${videoArg ?? "None"}`);
  console.log(`File Exists: ${exists}`);

  const sampleScript =
    "In this short video, I break down the 3 secrets to scaling short-form content. " +
    "Secret 1: Stop over-editing and focus on the hook. " +
    "Secret 2: Use multi-platform native aspect ratios. " +
    "Secret 3: Publish consistently with automated pipelines.";

  // Step 1: analyzeVideo
  console.log("\n[1/2] Running analyzeVideo...");
  const t0 = performance.now();
  const videoAnalysis = await analyzeVideo({
    filePath: exists ? resolvedPath! : undefined,
    fileUri: !exists && videoArg ? videoArg : undefined,
    mimeType: "video/mp4",
  });
  const t1 = performance.now();
  const analyzeLatency = ((t1 - t0) / 1000).toFixed(2);
  console.log(`analyzeVideo Latency: ${analyzeLatency}s`);

  const transcriptLines = (videoAnalysis.transcript || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log(`\nTranscript (first 10 lines, total ${transcriptLines.length} lines):`);
  if (transcriptLines.length === 0) {
    console.log("  (No transcript lines generated / fallback returned empty transcript)");
  } else {
    transcriptLines.slice(0, 10).forEach((line, idx) => {
      console.log(`  ${idx + 1}: ${line}`);
    });
  }

  console.log(`\nScene Count: ${videoAnalysis.scenes.length}`);
  if (videoAnalysis.scenes.length > 0) {
    videoAnalysis.scenes.slice(0, 5).forEach((scene, idx) => {
      console.log(`  Scene ${idx + 1} [${scene.startTime} - ${scene.endTime}]: ${scene.description}`);
    });
  }

  // Step 2: runCreatorPipeline
  console.log("\n[2/2] Running runCreatorPipeline...");
  const t2 = performance.now();
  const pipelineResult = await runCreatorPipeline({
    script: sampleScript,
    video: {
      filePath: exists ? resolvedPath! : undefined,
      fileUri: !exists && videoArg ? videoArg : undefined,
      mimeType: "video/mp4",
    },
    transcript: videoAnalysis.transcript || undefined,
    platforms: ["youtube_shorts", "tiktok", "instagram_reels"],
  });
  const t3 = performance.now();
  const pipelineLatency = ((t3 - t2) / 1000).toFixed(2);
  console.log(`runCreatorPipeline Latency: ${pipelineLatency}s`);

  console.log("\nSuggested Clips:");
  if (pipelineResult.clips.length === 0) {
    console.log("  (No clips generated)");
  } else {
    pipelineResult.clips.forEach((clip, idx) => {
      console.log(`  Clip ${idx + 1} [${clip.startTime} - ${clip.endTime}] (Conf: ${clip.confidence}): ${clip.title}`);
    });
  }

  console.log("\nPipeline Warnings:");
  if (pipelineResult.warnings.length === 0) {
    console.log("  (None)");
  } else {
    pipelineResult.warnings.forEach((w, idx) => {
      console.log(`  Warning ${idx + 1}: ${w}`);
    });
  }

  console.log("\n=== Video E2E Execution Complete ===");
}

main().catch((err) => {
  console.error("Fatal error in video e2e script:", err);
  process.exit(1);
});
