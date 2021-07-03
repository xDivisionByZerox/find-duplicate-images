import fs from 'fs';
import fsPromise from 'fs/promises';

// dynamic
const pathToCheck = '';

// hard set, dont touch
const outputDir = './duplicate-files/';
const htmlOutputFile = outputDir + 'index.html';
const jsOutputFile = outputDir + 'data.js';

interface IMapedFile {
  name: string;
  buffer: Buffer;
}

async function readFileListAsBuffers(fileList: string[]): Promise<IMapedFile[]> {
  const timerLabel = `Read ${fileList.length} files in`;
  console.time(timerLabel);
  const promises = fileList.map((name) => fsPromise.readFile(pathToCheck + name));
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

  const timerLabel = `Compared ${list.length} files in:`;
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
  await fsPromise.mkdir(outputDir, {
    recursive: true,
  });
  await fsPromise.writeFile(jsOutputFile, `const data = ${JSON.stringify(files)};`);

  const location = __dirname.replace(/\\/g, "/");
  await fsPromise.copyFile(`${location}/find-duplicate-files.html`, htmlOutputFile);

  console.log('Please open', htmlOutputFile, 'in your browser to view the results.');
}

(async () => {
  try {
    if(pathToCheck.length <= 0) {
      throw new Error('Please set "pathToCheck" variable to the location you want to check for duplicate files.');
    }

    const directoryOutput = await fsPromise.readdir(pathToCheck);
    const fileList = directoryOutput.filter((name) => fs.statSync(pathToCheck + name).isFile());
    const subDirectorys = directoryOutput.filter((name) => fs.statSync(pathToCheck + name).isDirectory());
    console.log('Found', subDirectorys.length, 'subdirectorys and', fileList.length, 'files to check');

    const map = await readFileListAsBuffers(fileList);
    const groupsOfSameFiles = await findDuplicatedFromMapedFileList(map);

    const formatedResults: IFileInfo[][] = groupsOfSameFiles.map((group): IFileInfo[] => {
      return group.map((elem) => {
        const fileName = fileList[elem]!;

        return {
          name: fileName,
          path: pathToCheck + fileName,
        };
      });
    })
    await ouputResults(formatedResults);
  } catch (error) {
    console.log('could not resolve duplicate files');
    console.log(error);
  }
})();