# File Organizer CLI | Automatically Organize Files by Extension using Node.js

A simple Node.js command-line utility that automatically organizes files into folders based on their file extensions.

Instead of manually sorting files, this script scans a directory, creates folders for each file extension, and moves files into their respective folders.

---

## Features

- Organizes files by extension
- Automatically creates folders if they do not exist
- Skips directories
- Skips the organizer script itself
- Uses asynchronous File System operations
- Lightweight with zero external dependencies

---

## Tech Stack

- Node.js
- JavaScript (ES2020+)
- fs/promises
- fs
- path

---

## Project Structure

```
file-organizer/
│
├── organizeFiles.js
├── README.md
├── LICENSE
└── .gitignore
```

---

## How It Works

Suppose your folder contains:

```
demo/

image1.png
image2.jpg
resume.pdf
notes.txt
song.mp3
video.mp4
script.js
archive.zip
organizeFiles.js
```

After running the script:

```
demo/

jpg/
    image2.jpg

png/
    image1.png

pdf/
    resume.pdf

txt/
    notes.txt

mp3/
    song.mp3

mp4/
    video.mp4

js/
    script.js

zip/
    archive.zip

organizeFiles.js
```

---

## Prerequisites

Install Node.js

Verify installation:

```bash
node -v
npm -v
```

---

## Installation

Clone the repository.

```bash
git clone https://github.com/anasqadri-dev/file-organizer-cli.git
```

Move into the project.

```bash
cd file-organizer
```

No dependencies are required.

---

## Usage

### Organize the Current Directory

```bash
node organizeFiles.js
```

The script organizes the directory from which it is executed.

---

### Organize Another Directory

```bash
node organizeFiles.js /path/to/folder
```

Example:

```bash
node organizeFiles.js ~/Downloads
```

or

```bash
node organizeFiles.js "C:\Users\Anas\Downloads"
```

---

## Example

Before

```
Downloads/

movie.mp4
resume.pdf
photo.jpg
notes.txt
archive.zip
```

After

```
Downloads/

mp4/
    movie.mp4

pdf/
    resume.pdf

jpg/
    photo.jpg

txt/
    notes.txt

zip/
    archive.zip
```

---

## Code Flow

1. Read the target directory.
2. Ignore the organizer script.
3. Skip folders.
4. Detect each file extension.
5. Create an extension folder if needed.
6. Move the file into that folder.
7. Print a success message.

---

## Built-in Modules Used

### fs/promises

Used for asynchronous file operations.

- readdir()
- stat()
- mkdir()
- rename()

### fs

Used for checking whether files or folders already exist.

- existsSync()

### path

Used for handling paths across different operating systems.

- join()
- basename()

---

## Future Improvements

- Recursive folder organization
- Undo operation
- Dry-run mode
- Colored terminal output
- Custom folder naming
- Ignore specific extensions
- Configuration file support
- File type categorization (Images, Documents, Videos, Audio)
- Logging
- Progress indicator

---

## Learning Outcomes

This project helped me understand:

- Node.js File System API
- Asynchronous programming
- Working with directories
- File management
- Path handling
- Building command-line utilities

---

## License

MIT License

Feel free to use, modify, and improve this project.
