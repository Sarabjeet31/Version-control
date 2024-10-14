# Sgit - A Simple Version Control System

Sgit is a lightweight, custom version control system designed to mimic the core functionalities of Git. It enables you to track changes to files, stage them, and commit them with ease, offering basic functionality like logging commits and displaying differences between file versions.

## Features

- **Initialize** a new repository with a `.Sgit` directory
- **Add files** to the staging area
- **Commit changes** with a message
- **Log** commit history
- **Show diffs** between committed versions
- **Status** of staged files

## Installation

Clone this repository and navigate to the directory:

```bash
git clone https://github.com/Sarabjeet31/sgit.git
cd sgit
```

Install the necessary dependencies using npm:

```bash
npm install
```

## Usage

### Initialize a repository

To initialize a new Sgit repository in the current directory:

```bash
npx sgit init
```

This creates a `.Sgit` directory, which will store all objects and commit information.

### Add files

To add a file to the staging area:

```bash
npx sgit add <filename>
```

Example:

```bash
npx sgit add sample.txt
```

### Commit changes

After staging files, commit them with a message:

```bash
npx sgit commit "Your commit message"
```

Example:

```bash
npx sgit commit "Initial commit"
```

### View commit log

To view the commit history:

```bash
npx sgit log
```

### Show differences

To see the changes between the current commit and the previous one:

```bash
npx sgit show <commitHash>
```

Example:

```bash
npx sgit show 7b9d7266145f34073d310f02d42568c6c3213bb4
```

### Check staged files status

To check the status of the staged files:

```bash
npx sgit status
```

## How It Works

- **`init`**: Creates a `.Sgit` directory that contains an `objects` folder for storing file contents and commits.
- **`add`**: Reads the content of the file, generates a SHA1 hash, and stores it in the `objects` directory. Updates the index with the file’s hash.
- **`commit`**: Creates a commit object that references the current state of the files, with a commit message and the parent commit (if any).
- **`log`**: Displays a history of all commits made in the repository.
- **`show`**: Displays the diff between the current commit and its parent (if available).
- **`status`**: Displays the status of staged files with their respective hashes.

## Dependencies

- [Commander](https://www.npmjs.com/package/commander) - For handling command-line input.
- [Chalk](https://www.npmjs.com/package/chalk) - For colored terminal output.
- [Diff](https://www.npmjs.com/package/diff) - For displaying file differences.
- [Crypto](https://nodejs.org/api/crypto.html) - For generating SHA1 hashes.
```