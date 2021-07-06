import fs from 'fs';
import path from 'path';
import fsPromise from 'fs/promises';
import { execSync } from 'child_process';

// dynamic
const config = {
  pathToCheck: 'C:',
  htmlFileName: 'index.html',
  jsFileName: 'data.js',
  outputDir: getPath(__dirname, 'duplicate-files'),
}

// hard set, dont touch
const htmlOutputFile = getPath(config.outputDir, config.htmlFileName);
const jsOutputFile = getPath(config.outputDir, config.jsFileName);

interface IMapedFile {
  name: string;
  buffer: Buffer;
}

function getPath(...pathes: string[]): string {
  return path.normalize(path.join(...pathes))
}

async function readFileListAsBuffers(fileList: string[]): Promise<IMapedFile[]> {
  const timerLabel = `Read ${fileList.length} files in`;
  console.time(timerLabel);
  const promises = fileList.map((name) => fsPromise.readFile(getPath(config.pathToCheck, name)));
  const buffers = await Promise.all(promises);
  const map = fileList.map((name, index) => ({
    name,
    buffer: buffers[index]!,
  }));
  console.timeEnd(timerLabel);

  return map;
}

async function findDuplicatedFromMapedFileList(list: IMapedFile[]): Promise<[number, number][]> {
  const groupsOfSameFiles: [number, number][] = [];

  const timerLabel = `Compared ${list.length} files in`;
  console.time(timerLabel);
  list.forEach((file, i) => {
    list.forEach((file2, k) => {
      if (i === k) {
        return;
      }

      if (!file.buffer.equals(file2.buffer)) {
        return;
      }

      const isIn = groupsOfSameFiles.find((elem) => elem.includes(i) && elem.includes(k));
      if (isIn) {
        return;
      }

      groupsOfSameFiles.push([i, k]);
    });
  });
  console.timeEnd(timerLabel);
  console.log('Found', groupsOfSameFiles.length, 'possible duplicates');

  return groupsOfSameFiles;
}

interface IFileInfo {
  name: string;
  path: string;
}

async function ouputResults(files: IFileInfo[][]) {
  await fsPromise.mkdir(config.outputDir, {
    recursive: true,
  });
  await fsPromise.writeFile(jsOutputFile, `const data = ${JSON.stringify(files)};`);

  const location = __dirname.replace(/\\/g, "/");
  await fsPromise.copyFile(getPath(location, 'find-duplicate-files.html'), htmlOutputFile);

  try {
    console.log('Trying to automatically open results');
    execSync(`${getStartBrowserCommand()} ${htmlOutputFile}`);
  } catch {
    console.log('Coult not open results automatically. Please open', htmlOutputFile, 'in your browser to view the results.');
  }
}

function getStartBrowserCommand() {
  const { platform } = process;
  if (platform === 'darwin') {
    return 'open';
  } else if (platform === 'win32') {
    return 'start';
  } else {
    return 'xdg-open';
  }
}

(async () => {
  try {
    if (config.pathToCheck.length <= 0) {
      throw new Error('Please set "pathToCheck" variable to the location you want to check for duplicate files.');
    }

    const directoryOutput = await fsPromise.readdir(config.pathToCheck);
    const fileList = directoryOutput.filter((name) => fs.statSync(getPath(config.pathToCheck, name)).isFile());
    const subDirectorys = directoryOutput.filter((name) => fs.statSync(getPath(config.pathToCheck,name)).isDirectory());
    console.log('Found', subDirectorys.length, 'subdirectorys and', fileList.length, 'files to check');

    const map = await readFileListAsBuffers(fileList);
    const groupsOfSameFiles = await findDuplicatedFromMapedFileList(map);

    const formatedResults: IFileInfo[][] = groupsOfSameFiles.map((group): IFileInfo[] => {
      return group.map((elem) => {
        const fileName = fileList[elem]!;

        return {
          name: fileName,
          path: getPath(config.pathToCheck, fileName),
        };
      });
    })
    await ouputResults(formatedResults);
  } catch (error) {
    console.log('could not resolve duplicate files');
    console.log(error);
  }
})();