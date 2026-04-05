const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load .env.local or .env
const envLocal = path.join(__dirname, "..", ".env.local");
const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envLocal)) {
  require("dotenv").config({ path: envLocal });
} else {
  require("dotenv").config({ path: envFile });
}

const MONGODB_URI = process.env.MONGODB_URI || "";

const swipeSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["like", "pass"], required: true },
  },
  { timestamps: true },
);

const Swipe = mongoose.models.Swipe || mongoose.model("Swipe", swipeSchema);

function usage() {
  console.log("Usage:");
  console.log("  node scripts/reset-swipes.js [--mode=daily|all] [--dry-run]");
  console.log("");
  console.log("Modes:");
  console.log("  all    (default) -> delete all swipes for all users");
  console.log("  daily            -> reset daily swipe usage by backdating today's swipes");
}

function getArgValue(name) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`));
  if (!arg) return undefined;
  return arg.slice(name.length + 1);
}

function getTodayWindow() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  return { startOfDay, endOfDay };
}

async function run() {
  const showHelp = process.argv.includes("--help") || process.argv.includes("-h");
  if (showHelp) {
    usage();
    process.exit(0);
  }

  const dryRun = process.argv.includes("--dry-run");
  const rawMode = (getArgValue("--mode") || "all").toLowerCase();
  const mode = rawMode === "daily" ? "daily" : "all";

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in .env or .env.local");
  }

  console.log(`Connecting to MongoDB (${mode} mode${dryRun ? ", dry-run" : ""})...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  if (mode === "all") {
    const total = await Swipe.countDocuments({});
    console.log(`Found ${total} swipe documents.`);

    if (dryRun) {
      console.log("Dry-run: no documents were deleted.");
      return;
    }

    const result = await Swipe.deleteMany({});
    console.log(`Deleted ${result.deletedCount ?? 0} swipe documents.`);
    return;
  }

  const { startOfDay, endOfDay } = getTodayWindow();
  const query = { createdAt: { $gte: startOfDay, $lt: endOfDay } };
  const todaysCount = await Swipe.countDocuments(query);

  console.log(`Today's swipe documents: ${todaysCount}`);

  if (dryRun || todaysCount === 0) {
    console.log(
      dryRun
        ? "Dry-run: no documents were updated."
        : "Nothing to reset for today.",
    );
    return;
  }

  // Move today's swipes to yesterday so daily limits reset while keeping swipe relationships.
  const backdatedTo = new Date(startOfDay.getTime() - 60 * 1000);
  const updateResult = await Swipe.collection.updateMany(query, {
    $set: {
      createdAt: backdatedTo,
      updatedAt: new Date(),
    },
  });

  const matched = updateResult.matchedCount ?? updateResult.result?.n ?? 0;
  const modified =
    updateResult.modifiedCount ?? updateResult.result?.nModified ?? 0;

  console.log(`Matched ${matched}, updated ${modified} swipe documents.`);
  console.log("Daily swipes reset for all accounts.");
}

run()
  .catch((error) => {
    console.error("Failed to reset swipes:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {}
  });
