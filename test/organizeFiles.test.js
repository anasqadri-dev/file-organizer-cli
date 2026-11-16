const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const {
  getExtensionFolder,
  organize,
  organizeFile,
  resolveTargetDirectory,
} = require("../organizeFiles");

async function createTemporaryDirectory() {
  return fs.mkdtemp(path.join(os.tmpdir(), "file-organizer-"));
}

test("getExtensionFolder normalizes extensions and ignores extensionless or unsafe extensions", () => {
  assert.equal(getExtensionFolder("photo.PNG"), "png");
  assert.equal(getExtensionFolder("archive.tar.gz"), "gz");
  assert.equal(getExtensionFolder("README"), null);
  assert.equal(getExtensionFolder(".gitignore"), null);
  assert.equal(getExtensionFolder("payload.@@@"), null);
});

test("resolveTargetDirectory rejects traversal and absolute paths", async (t) => {
  const base = await createTemporaryDirectory();
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  await assert.rejects(resolveTargetDirectory("../outside", base), /child directory/);
  await assert.rejects(resolveTargetDirectory(path.resolve(base), base), /child directory/);
});

test("resolveTargetDirectory rejects a missing child directory", async (t) => {
  const base = await createTemporaryDirectory();
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  await assert.rejects(resolveTargetDirectory("missing", base), /Directory does not exist/);
});

test("resolveTargetDirectory rejects a file instead of a directory", async (t) => {
  const base = await createTemporaryDirectory();
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  await fs.writeFile(path.join(base, "target"), "content");
  await assert.rejects(resolveTargetDirectory("target", base), /Directory does not exist/);
});

test("organize moves files by extension and leaves directories and extensionless files in place", async (t) => {
  const base = await createTemporaryDirectory();
  const directory = path.join(base, "input");
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  await fs.mkdir(directory);

  await fs.writeFile(path.join(directory, "photo.PNG"), "image");
  await fs.writeFile(path.join(directory, "notes.txt"), "notes");
  await fs.writeFile(path.join(directory, "README"), "readme");
  await fs.mkdir(path.join(directory, "existing-folder"));

  await organize("input", base);

  assert.equal(await fs.readFile(path.join(directory, "png", "photo.PNG"), "utf8"), "image");
  assert.equal(await fs.readFile(path.join(directory, "txt", "notes.txt"), "utf8"), "notes");
  assert.equal(await fs.readFile(path.join(directory, "README"), "utf8"), "readme");
  assert.equal((await fs.stat(path.join(directory, "existing-folder"))).isDirectory(), true);
});

test("organize handles an empty directory", async (t) => {
  const base = await createTemporaryDirectory();
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  await fs.mkdir(path.join(base, "empty"));
  await organize("empty", base);
  assert.deepEqual(await fs.readdir(path.join(base, "empty")), []);
});

test("organizeFile ignores non-regular entries and the organizer script", async (t) => {
  const directory = await createTemporaryDirectory();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.mkdir(path.join(directory, "folder"));
  await fs.writeFile(path.join(directory, "organizeFiles.js"), "leave me");
  await organizeFile(directory, "folder");
  await organizeFile(directory, "organizeFiles.js");
  assert.equal((await fs.stat(path.join(directory, "folder"))).isDirectory(), true);
  assert.equal(await fs.readFile(path.join(directory, "organizeFiles.js"), "utf8"), "leave me");
});

test("resolveTargetDirectory rejects filesystem root", async () => {
  const root = path.parse(process.cwd()).root;
  await assert.rejects(resolveTargetDirectory(".", root), /filesystem root/);
});

test("resolveTargetDirectory rejects symlinks that escape the working directory", async (t) => {
  const base = await createTemporaryDirectory();
  const outside = await createTemporaryDirectory();
  t.after(() => Promise.all([
    fs.rm(base, { recursive: true, force: true }),
    fs.rm(outside, { recursive: true, force: true }),
  ]));
  await fs.symlink(outside, path.join(base, "escape"), "dir");
  await assert.rejects(resolveTargetDirectory("escape", base), /Directory does not exist/);
});

test("CLI reports invalid target and exits with failure", async (t) => {
  const base = await createTemporaryDirectory();
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [path.join(__dirname, "..", "organizeFiles.js"), "missing"], {
    cwd: base,
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Directory does not exist/);
});

test("CLI organizes the requested child directory", async (t) => {
  const base = await createTemporaryDirectory();
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  await fs.mkdir(path.join(base, "inbox"));
  await fs.writeFile(path.join(base, "inbox", "notes.txt"), "notes");

  const result = spawnSync(process.execPath, [path.join(__dirname, "..", "organizeFiles.js"), "inbox"], {
    cwd: base,
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /File organization completed/);
  assert.equal(await fs.readFile(path.join(base, "inbox", "txt", "notes.txt"), "utf8"), "notes");
});
