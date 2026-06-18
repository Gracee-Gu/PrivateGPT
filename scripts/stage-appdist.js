const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const appdistDir = path.join(repoRoot, "appdist");
const backendDistDir = path.join(repoRoot, "backend", "dist");
const executableCandidates = [
  path.join(backendDistDir, "app.exe"),
  path.join(backendDistDir, "app"),
];
const databaseCandidates = [
  path.join(repoRoot, "backend", "database.db"),
  path.join(repoRoot, "backend", "database", "database_template.db"),
  path.join(repoRoot, "database_starter_good.db"),
];

const executablePath = executableCandidates.find((candidate) => fs.existsSync(candidate));
const databasePath = databaseCandidates.find((candidate) => {
  if (!fs.existsSync(candidate)) {
    return false;
  }

  return fs.statSync(candidate).size > 0;
});

if (!executablePath) {
  console.error("Expected a packaged backend executable in backend/dist/app(.exe).");
  process.exit(1);
}

if (!databasePath) {
  console.error("Expected a non-empty database seed in backend/database.db or one of the template database files.");
  process.exit(1);
}

fs.mkdirSync(appdistDir, { recursive: true });

const stagedExecutablePath = path.join(appdistDir, path.basename(executablePath));
const stagedDatabasePath = path.join(appdistDir, "database.db");

fs.copyFileSync(executablePath, stagedExecutablePath);
fs.copyFileSync(databasePath, stagedDatabasePath);

console.log(
  `Staged ${path.relative(repoRoot, executablePath)} and ${path.relative(repoRoot, databasePath)} into ${path.relative(repoRoot, appdistDir)}.`
);
