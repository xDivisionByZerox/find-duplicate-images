import fs from 'fs';
import path from 'path';
import fsPromise from 'fs/promises';
import { execSync } from 'child_process';

interface IMapedFile {
  name: string;
  buffer: Buffer;
}

interface IFileInfo {
  name: string;
  path: string;
}

function getPath(...pathes: string[]): string {
  return path.normalize(path.join(...pathes))
}

interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
}

class DuplicateFileFinder {

  private readonly $pathToCheck: string

  constructor(params: IDuplicateFileFinderConstructor) {
    const { pathToCheck } = params;
    if (pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$pathToCheck = pathToCheck;
  }

  public async find(): Promise<IFileInfo[][]> {
    const directoryOutput = await fsPromise.readdir(this.$pathToCheck);
    const fileList = directoryOutput.filter((name) => fs.statSync(getPath(this.$pathToCheck, name)).isFile());
    const subDirectorys = directoryOutput.filter((name) => fs.statSync(getPath(this.$pathToCheck, name)).isDirectory());
    console.log('Found', subDirectorys.length, 'subdirectorys and', fileList.length, 'files to check');

    const map = await this.readFileListAsBuffers(fileList);
    const groupsOfSameFiles = await this.findDuplicatedFromMapedFileList(map);

    const formatedResults: IFileInfo[][] = groupsOfSameFiles.map((group): IFileInfo[] => {
      return group.map((elem) => {
        const fileName = fileList[elem]!;

        return {
          name: fileName,
          path: getPath(config.pathToCheck, fileName),
        };
      });
    });

    return formatedResults;
  }

  private async readFileListAsBuffers(fileList: string[]): Promise<IMapedFile[]> {
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

  private async findDuplicatedFromMapedFileList(list: IMapedFile[]): Promise<[number, number][]> {
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
};

interface IResultHandlerConstructor {
  outputDir: string;
  jsFileName: string;
  htmlFileName: string;
}

class ResultHandler {

  private readonly $htmlOutputFile: string;
  private readonly $jsOutputFile: string;

  constructor(params: IResultHandlerConstructor) {
    this.$htmlOutputFile = getPath(params.outputDir, params.htmlFileName);
    this.$jsOutputFile = getPath(params.outputDir, params.jsFileName);
  }

  async ouputResults(files: IFileInfo[][]) {
    await fsPromise.mkdir(config.outputDir, {
      recursive: true,
    });
    await fsPromise.writeFile(this.$jsOutputFile, `const data = ${JSON.stringify(files)};`);

    const location = __dirname.replace(/\\/g, "/");
    await fsPromise.copyFile(getPath(location, 'find-duplicate-files.html'), this.$htmlOutputFile);

    try {
      console.log('Trying to automatically open results');
      const cmd = this.getStartBrowserCommand();
      execSync(`${cmd} ${this.$htmlOutputFile}`);
    } catch {
      console.log('Coult not open results automatically. Please open', this.$htmlOutputFile, 'in your browser to view the results.');
    }
  }

  private getStartBrowserCommand() {
    const { platform } = process;
    if (platform === 'darwin') {
      return 'open';
    } else if (platform === 'win32') {
      return 'start';
    } else {
      return 'xdg-open';
    }
  }
};

type Config = IResultHandlerConstructor & IDuplicateFileFinderConstructor;

// dynamic
const config: Config = {
  pathToCheck: 'D:\\OneDrive\\Bilder',
  htmlFileName: 'index.html',
  jsFileName: 'data.js',
  outputDir: getPath(__dirname, 'duplicate-files'),
};

(async () => {
  try {
    const results = await new DuplicateFileFinder({ pathToCheck: config.pathToCheck }).find();
    await new ResultHandler({
      htmlFileName: config.htmlFileName,
      jsFileName: config.jsFileName,
      outputDir: config.outputDir,
    }).ouputResults(results);
  } catch (error) {
    console.log('could not resolve duplicate files');
    console.log(error);
  }
})();