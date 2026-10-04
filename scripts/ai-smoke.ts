import {
  generateHooks,
  suggestClips,
  adaptContent,
  matchScriptToFootage,
  buildEditDecisionList,
  generateCreatorInsights,
} from "../src/lib/ai/services";

async function runSmokeTests() {
  console.log("=== CreatorAI AI Service Layer Smoke Tests ===");
  let allPassed = true;

  // Test 1: generateHooks
  try {
    const hooks = await generateHooks("Building an AI startup from scratch using Next.js and Gemini.");
    if (Array.isArray(hooks) && hooks.length === 3 && hooks.every((h) => typeof h === "string" && h.length <= 140)) {
      console.log("PASS: generateHooks");
    } else {
      console.error("FAIL: generateHooks (invalid structure)", hooks);
      allPassed = false;
    }
  } catch (err) {
    console.error("FAIL: generateHooks threw error", err);
    allPassed = false;
  }

  // Test 2: suggestClips
  try {
    const script = "First step is planning. Then we build. Finally we ship.";
    const transcript = "[00:00] Intro [00:15] Planning phase [00:45] Building architecture [01:15] Shipping to users";
    const clips = await suggestClips(script, transcript);
    if (
      Array.isArray(clips) &&
      clips.length >= 1 &&
      clips.every(
        (c) =>
          typeof c.startTime === "string" &&
          typeof c.endTime === "string" &&
          c.endSeconds > c.startSeconds &&
          c.confidence >= 0 &&
          c.confidence <= 1
      )
    ) {
      console.log("PASS: suggestClips");
    } else {
      console.error("FAIL: suggestClips (invalid structure)", clips);
      allPassed = false;
    }
  } catch (err) {
    console.error("FAIL: suggestClips threw error", err);
    allPassed = false;
  }

  // Test 3: adaptContent
  try {
    const adaptations = await adaptContent("How to double your reach with short form video", [
      "youtube_shorts",
      "instagram_reels",
      "tiktok",
      "x",
      "linkedin",
    ]);
    if (
      Array.isArray(adaptations) &&
      adaptations.length === 5 &&
      adaptations.every((a) => a.platform && a.caption && a.hashtags.length > 0 && a.aspectRatio)
    ) {
      console.log("PASS: adaptContent");
    } else {
      console.error("FAIL: adaptContent (invalid structure)", adaptations);
      allPassed = false;
    }
  } catch (err) {
    console.error("FAIL: adaptContent threw error", err);
    allPassed = false;
  }

  // Test 4: matchScriptToFootage
  try {
    const script = "Beat 1: Problem statement. Beat 2: Solution demo.";
    const transcript = "[00:00] The problem creators face [00:25] Live demo of the platform [00:55] Conclusion";
    const matches = await matchScriptToFootage(script, transcript);
    if (
      Array.isArray(matches) &&
      matches.length >= 1 &&
      matches.every((m) => m.scriptBeat && m.startSeconds < m.endSeconds && m.matchScore >= 0)
    ) {
      console.log("PASS: matchScriptToFootage");
    } else {
      console.error("FAIL: matchScriptToFootage (invalid structure)", matches);
      allPassed = false;
    }
  } catch (err) {
    console.error("FAIL: matchScriptToFootage threw error", err);
    allPassed = false;
  }

  // Test 5: buildEditDecisionList
  try {
    const sampleClips = [
      {
        startTime: "00:00",
        endTime: "00:30",
        startSeconds: 0,
        endSeconds: 30,
        title: "Intro Hook",
        reason: "Strong hook",
        confidence: 0.9,
      },
      {
        startTime: "00:30",
        endTime: "01:00",
        startSeconds: 30,
        endSeconds: 60,
        title: "Key Demo",
        reason: "Actionable demo",
        confidence: 0.85,
      },
    ];
    const edl = buildEditDecisionList(sampleClips, {
      hook: "Watch this before you edit",
      platform: "tiktok",
    });
    if (edl && edl.version === 1 && edl.platform === "tiktok" && Array.isArray(edl.items) && edl.items.length === 5) {
      console.log("PASS: buildEditDecisionList");
    } else {
      console.error("FAIL: buildEditDecisionList (invalid structure)", edl);
      allPassed = false;
    }
  } catch (err) {
    console.error("FAIL: buildEditDecisionList threw error", err);
    allPassed = false;
  }

  // Test 6: generateCreatorInsights
  try {
    const stats = [
      {
        title: "Video 1",
        platform: "tiktok",
        views: 10000,
        likes: 1200,
        comments: 150,
        shares: 80,
        durationSeconds: 35,
        publishedAt: "2026-10-01",
      },
      {
        title: "Video 2",
        platform: "youtube_shorts",
        views: 25000,
        likes: 3100,
        comments: 420,
        shares: 200,
        durationSeconds: 45,
        publishedAt: "2026-10-02",
      },
    ];
    const insights = await generateCreatorInsights(stats);
    if (
      insights &&
      typeof insights.summary === "string" &&
      Array.isArray(insights.topPerformers) &&
      insights.topPerformers.length > 0 &&
      Array.isArray(insights.patterns) &&
      Array.isArray(insights.recommendations)
    ) {
      console.log("PASS: generateCreatorInsights");
    } else {
      console.error("FAIL: generateCreatorInsights (invalid structure)", insights);
      allPassed = false;
    }
  } catch (err) {
    console.error("FAIL: generateCreatorInsights threw error", err);
    allPassed = false;
  }

  if (!allPassed) {
    process.exit(1);
  }
}

runSmokeTests();
