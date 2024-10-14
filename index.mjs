#!/usr/bin/env node

import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { diffLines } from 'diff';
import chalk from 'chalk';
import { Command } from 'commander';

const program = new Command();

class Sgit {

    constructor(repoPath = '.') {
        this.repoPath = path.join(repoPath, '.Sgit');
        this.objectsPath = path.join(this.repoPath, 'objects'); // .Sgit/objects
        this.headPath = path.join(this.repoPath, 'HEAD'); // .Sgit/HEAD
        this.indexPath = path.join(this.repoPath, 'index'); // .Sgit/index
        this.init();
    }

    async init() {
        await fs.mkdir(this.objectsPath, {recursive: true});
        try {
            await fs.writeFile(this.headPath, '', {flag: 'wx'}); // wx: open for writing. fails if file exists
            await fs.writeFile(this.indexPath, JSON.stringify([]), {flag: 'wx'});
        } catch (error) {
            console.log("Already initialised the .Sgit folder");
        }
    }

    hashObject(content) {
        return crypto.createHash('sha1').update(content, 'utf-8').digest('hex');
    }

    async add(fileToBeAdded) {
        // fileToBeAdded: path/to/file
        const fileData = await fs.readFile(fileToBeAdded, { encoding: 'utf-8' }); // read the file
        const fileHash = this.hashObject(fileData); // hash the file
        console.log(fileHash);
        const newFileHashedObjectPath = path.join(this.objectsPath, fileHash); // .Sgit/objects/abc123
        await fs.writeFile(newFileHashedObjectPath, fileData);
        await this.updateStagingArea(fileToBeAdded, fileHash);
        console.log(`Added ${fileToBeAdded}`);

    }

    async updateStagingArea(filePath, fileHash) {
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' })); // read the index file
        index.push({ path : filePath, hash: fileHash }); // add the file to the index
        await fs.writeFile(this.indexPath, JSON.stringify(index)); // write the updated index file
    }

    async commit(message) {
        const index = JSON.parse(await fs.readFile(this.indexPath, { encoding: 'utf-8' }));
        const parentCommit = await this.getCurrentHead();

        const commitData = {
            timeStamp: new Date().toISOString(),
            message,
            files: index,
            parent: parentCommit
        };

        const commitHash = this.hashObject(JSON.stringify(commitData));
        const commitPath = path.join(this.objectsPath, commitHash);
        await fs.writeFile(commitPath, JSON.stringify(commitData));
        await fs.writeFile(this.headPath, commitHash); // update the HEAD to point to the new commit
        await fs.writeFile(this.indexPath, JSON.stringify([])); // clear the staging area
        console.log(`Commit successfully created: ${commitHash}`); 

    }

    async getCurrentHead() {
        try {
            return await fs.readFile(this.headPath, { encoding: 'utf-8' });
        } catch(error) {
            return null;
        }
    }

    async log() {
        let currentCommitHash = await this.getCurrentHead();;
        while(currentCommitHash) {
            const commitData = JSON.parse(await fs.readFile(path.join(this.objectsPath, currentCommitHash), { encoding: 'utf-8' }));
            console.log(`---------------------\n`)
            console.log(`Commit: ${currentCommitHash}\nDate: ${commitData.timeStamp}\n\n${commitData.message}\n\n`);

            currentCommitHash = commitData.parent;
        }
    }

    async showCommitDiff(commitHash) {
        const commitData = JSON.parse(await this.getCommitData(commitHash));
        if(!commitData) {
            console.log("Commit not found");
            return;
        }
        console.log("Changes in the last commit are: ");

        for(const file of commitData.files) {
            console.log(`File: ${file.path}`);
            const fileContent = await this.getFileContent(file.hash);
            console.log(fileContent);

            if(commitData.parent) {
                // get the parent commit data
                const parentCommitData = JSON.parse(await this.getCommitData(commitData.parent));
                const getParentFileContent = await this.getParentFileContent(parentCommitData, file.path);
                if(getParentFileContent !== undefined) {
                    console.log('\nDiff:');
                    const diff = diffLines(getParentFileContent, fileContent);

                    // console.log(diff);

                    diff.forEach(part => {
                        if(part.added) {
                            process.stdout.write(chalk.green("++" + part.value));
                        } else if(part.removed) {    
                            process.stdout.write(chalk.red("--" + part.value));
                        } else {
                            process.stdout.write(chalk.grey(part.value));
                        }
                    });
                    console.log(); // new line
                } else {
                    console.log("New file in this commit");
                }

            } else {
                console.log("First commit");
            }

        }
    }

    async getParentFileContent(parentCommitData, filePath) {
        const parentFile = parentCommitData.files.find(file => file.path === filePath);
        if(parentFile) {
            // get the file content from the parent commit and return the content
            return await this.getFileContent(parentFile.hash);
        }
    }

    async getCommitData(commithash) {
        const commitPath = path.join(this.objectsPath, commithash);
        try {
            return await fs.readFile(commitPath, { encoding: 'utf-8'});
        } catch(error) {
            console.log("Failed to read the commit data", error);
            return null;
        }
    }

    async getFileContent(fileHash) {
        const objectPath = path.join(this.objectsPath, fileHash);
        return fs.readFile(objectPath, { encoding: 'utf-8' });
    }

    async getStagedFile() {
      try {
        return await fs.readFile(this.indexPath, { encoding: 'utf-8' });
      } catch(error) {
        console.log('Failed to read the staged file', error);
        return null;
      }
    }

    async status() {
      const stagedFile = JSON.parse(await this.getStagedFile());
      if (stagedFile == '') {
        console.log(chalk.red('No staged file'));
      }
      for (const file of stagedFile) {
        console.log(chalk.green(`${file.path}\t${file.hash}`));
      }
    }



}

// (async () => {
//     const Sgit = new Sgit();
//     // await Sgit.add('sample.txt');
//     // await Sgit.add('sample2.txt');
//     // await Sgit.commit('4th commit');

//     // await Sgit.log();
//     await Sgit.showCommitDiff('7b9d7266145f34073d310f02d42568c6c3213bb4');
// })();

program.command('init').action(async () => {
    const sgit = new Sgit();
});

program.command('add <file>').action(async (file) => {
    const sgit = new Sgit();
    await sgit.add(file);
});

program.command('commit <message>').action(async (message) => {
    const sgit = new Sgit();
    await sgit.commit(message);
});

program.command('log').action(async () => {
    const sgit = new Sgit();
    await sgit.log();
});

program.command('show <commitHash>').action(async (commitHash) => {
    const sgit = new Sgit();
    await sgit.showCommitDiff(commitHash);
});

program.command('status').action(async () => {
    const sgit = new Sgit();
    await sgit.status();
});

// console.log(process.argv);
program.parse(process.argv);