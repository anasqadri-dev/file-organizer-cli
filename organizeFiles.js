const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_DIRECTORY = ".";
const DIRECTORY_ARGUMENT_INDEX = 2;
const SCRIPT_NAME = path.basename(__filename);
const SUCCESS_MESSAGE = "File organization completed!";
const MISSING_DIRECTORY_MESSAGE = "Directory does not exist.";
const INVALID_DIRECTORY_MESSAGE = "Target must be an existing directory.";
const INVALID_TARGET_MESSAGE = "Target directory must not be the filesystem root.";
const INVALID_NAME_MESSAGE = "Provide the name of an existing child directory (letters, numbers, underscores, or hyphens).";
const OUTSIDE_BASE_MESSAGE = "Target directory must be a direct child of the working directory.";
const SAME_DIRECTORY_MESSAGE = "Cannot organize a directory into itself.";
const ERROR_EXIT_CODE = 1;
const SAFE_DIRECTORY_NAME = /^[A-Za-z0-9_-]+$/;
const SAFE_EXTENSION = /^[a-z0-9]+$/;

/**
 * Resolve a directory by matching its name against entries in a trusted base.
 * User input is never passed to a filesystem path operation.
 * @param {string} requestedDirectory
 * @param {string} baseDirectory
 * @returns {Promise<string>}
 */
async function resolveTargetDirectory(requestedDirectory = DEFAULT_DIRECTORY, baseDirectory = process.cwd()) {
  if (
    typeof requestedDirectory !== "string" ||
    (requestedDirectory !== DEFAULT_DIRECTORY && !SAFE_DIRECTORY_NAME.test(requestedDirectory))
  ) {
    throw new Error(INVALID_NAME_MESSAGE);
  }

  const trustedBase = await fs.realpath(baseDirectory);
  let targetDirectory = trustedBase;

  if (requestedDirectory !== DEFAULT_DIRECTORY) {
    const entries = await fs.readdir(trustedBase, { withFileTypes: true });
    const matchingEntry = entries.find(
      (entry) => entry.name === requestedDirectory && entry.isDirectory()
    );

    if (!matchingEntry) {
      throw new Error(MISSING_DIRECTORY_MESSAGE);
    }

    targetDirectory = await fs.realpath(path.join(trustedBase, matchingEntry.name));
  }

  const relativeTarget = path.relative(trustedBase, targetDirectory);
  if (
    relativeTarget.startsWith(`..${path.sep}`) ||
    relativeTarget === ".." ||
    path.isAbsolute(relativeTarget)
  ) {
    throw new Error(OUTSIDE_BASE_MESSAGE);
  }

  const rootDirectory = path.parse(targetDirectory).root;
  if (targetDirectory === rootDirectory) {
    throw new Error(INVALID_TARGET_MESSAGE);
  }

  const directoryStats = await fs.stat(targetDirectory);
  if (!directoryStats.isDirectory()) {
    throw new Error(INVALID_DIRECTORY_MESSAGE);
  }

  const scriptDirectory = path.dirname(path.resolve(__filename));
  if (targetDirectory === scriptDirectory) {
    throw new Error(SAME_DIRECTORY_MESSAGE);
  }

  return targetDirectory;
}

/**
 * Return a safe extension folder name, or null for extensionless files.
 * @param {string} fileName
 * @returns {string|null}
 */
function getExtensionFolder(fileName) {
  const extension = path.extname(fileName).slice(1).toLowerCase();
  if (!extension || !SAFE_EXTENSION.test(extension)) {
    return null;
  }
  return extension;
}

/**
 * Move one regular file whose name came from readdir in the target directory.
 * @param {string} targetDirectory
 * @param {string} fileName
 */
async function organizeFile(targetDirectory, fileName) {
  if (
    typeof fileName !== "string" ||
    fileName !== path.basename(fileName) ||
    fileName === "." ||
    fileName === ".." ||
    fileName === SCRIPT_NAME
  ) {
    return;
  }

  const sourcePath = path.join(targetDirectory, fileName);
  const sourceStats = await fs.lstat(sourcePath);
  if (!sourceStats.isFile()) {
    return;
  }

  const extensionFolder = getExtensionFolder(fileName);
  if (!extensionFolder) {
    return;
  }

  const destinationDirectory = path.join(targetDirectory, extensionFolder);
  const relativeDestination = path.relative(targetDirectory, destinationDirectory);
  if (
    relativeDestination.startsWith(`..${path.sep}`) ||
    relativeDestination === ".." ||
    path.isAbsolute(relativeDestination)
  ) {
    throw new Error("Refusing to move a file outside the target directory.");
  }

  await fs.mkdir(destinationDirectory, { recursive: true });
  const destinationPath = path.join(destinationDirectory, path.basename(fileName));
  await fs.rename(sourcePath, destinationPath);
}

/**
 * Organize regular files in the selected working directory.
 * @param {string} requestedDirectory
 * @param {string} baseDirectory
 */
async function organize(requestedDirectory = DEFAULT_DIRECTORY, baseDirectory = process.cwd()) {
  const targetDirectory = await resolveTargetDirectory(requestedDirectory, baseDirectory);
  const entries = await fs.readdir(targetDirectory, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);

  await Promise.all(files.map((fileName) => organizeFile(targetDirectory, fileName)));
  console.log(SUCCESS_MESSAGE);
}

if (require.main === module) {
  const requestedDirectory = process.argv[DIRECTORY_ARGUMENT_INDEX] || DEFAULT_DIRECTORY;
  organize(requestedDirectory).catch((error) => {
    console.error(error.message);
    process.exitCode = ERROR_EXIT_CODE;
  });
}

module.exports = {
  getExtensionFolder,
  organize,
  organizeFile,
  resolveTargetDirectory,
};
