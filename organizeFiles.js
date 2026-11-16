const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_DIRECTORY = process.cwd();
const DIRECTORY_ARGUMENT_INDEX = 2;
const SCRIPT_NAME = path.basename(__filename);
const SUCCESS_MESSAGE = "File organization completed!";
const MISSING_DIRECTORY_MESSAGE = "Directory does not exist.";
const INVALID_DIRECTORY_MESSAGE = "Target must be an existing directory.";
const INVALID_TARGET_MESSAGE = "Target directory must not be the filesystem root.";
const SAME_DIRECTORY_MESSAGE = "Cannot organize a directory into itself.";
const ERROR_EXIT_CODE = 1;

/**
 * Resolve and validate a user-supplied directory before moving any files.
 * Resolving the path once prevents traversal segments from escaping the
 * requested target and ensures all generated destinations remain contained.
 *
 * @param {string} requestedDirectory
 * @returns {Promise<string>}
 */
async function resolveTargetDirectory(requestedDirectory) {
  const targetDirectory = path.resolve(requestedDirectory);
  const rootDirectory = path.parse(targetDirectory).root;

  if (targetDirectory === rootDirectory) {
    throw new Error(INVALID_TARGET_MESSAGE);
  }

  let directoryStats;
  try {
    directoryStats = await fs.stat(targetDirectory);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error(MISSING_DIRECTORY_MESSAGE);
    }
    throw error;
  }

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
 *
 * @param {string} fileName
 * @returns {string|null}
 */
function getExtensionFolder(fileName) {
  const extension = path.extname(fileName).slice(1).toLowerCase();
  if (!extension || extension === "." || extension === "..") {
    return null;
  }
  return extension;
}

/**
 * Move one file to its extension folder.
 *
 * @param {string} targetDirectory
 * @param {string} fileName
 */
async function organizeFile(targetDirectory, fileName) {
  if (fileName === SCRIPT_NAME) {
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

  const destinationDirectory = path.resolve(targetDirectory, extensionFolder);
  const relativeDestination = path.relative(targetDirectory, destinationDirectory);

  if (
    relativeDestination.startsWith(`..${path.sep}`) ||
    relativeDestination === ".." ||
    path.isAbsolute(relativeDestination)
  ) {
    throw new Error("Refusing to move a file outside the target directory.");
  }

  await fs.mkdir(destinationDirectory, { recursive: true });
  const destinationPath = path.join(destinationDirectory, fileName);
  await fs.rename(sourcePath, destinationPath);
}

/**
 * Organize all regular files in the specified directory.
 *
 * @param {string} requestedDirectory
 */
async function organize(requestedDirectory = DEFAULT_DIRECTORY) {
  const targetDirectory = await resolveTargetDirectory(requestedDirectory);
  const entries = await fs.readdir(targetDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      continue;
    }
    await organizeFile(targetDirectory, entry.name);
  }

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
