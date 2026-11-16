const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
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

test("getExtensionFolder normalizes extensions and handles extensionless files", () => {
  assert.equal(getExtensionFolder("photo.PNG"), "png");
  assert.equal(getExtensionFolder("archive.tar.gz"), "gz");
  assert.equal(getExtensionFolder("README"), null);
  assert.equal(getExtensionFolder(".gitignore"), null);
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

test("organizeFile ignores non-regular entries", async (t) => {
  const directory = await createTemporaryDirectory();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.mkdir(path.join(directory, "folder"));
  await organizeFile(directory, "folder");
  assert.equal((await fs.stat(path.join(directory, "folder"))).isDirectory(), true);
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
