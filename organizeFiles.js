const fs = require("fs/promises");
const fsn = require("fs");
const path = require("path");

const dir = process.argv[2] || process.cwd();
const scriptName = path.basename(__filename);

async function organize() {
  if (!fsn.existsSync(dir)) {
    console.log("Directory does not exist.");
    return;
  }

  const files = await fs.readdir(dir);

  for (const item of files) {
    if (item === scriptName) continue;

    const fullPath = path.join(dir, item);

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) continue;

    if (!item.includes(".")) continue;

    const extension = item.split(".").pop();

    const extensionDir = path.join(dir, extension);

    if (!fsn.existsSync(extensionDir)) {
      await fs.mkdir(extensionDir);
    }

    await fs.rename(fullPath, path.join(extensionDir, item));
  }
  console.log("File organization completed!");
}

organize().catch(console.error);
