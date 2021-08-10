import fs from 'fs';
import fsPromise from 'fs/promises';
import { IFileInfo } from '..';
import { Util } from './util';

interface IMapedFile {
  path: string;
  buffer: Buffer;
}

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
}

export class DuplicateFileFinder {

  private readonly $pathToCheck: string;

  constructor(params: IDuplicateFileFinderConstructor) {
    const { pathToCheck } = params;
    if (pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$pathToCheck = pathToCheck;
  }

  public async find(): Promise<IFileInfo[][]> {
    const directoryOutput = await fsPromise.readdir(this.$pathToCheck);
    const pathList = directoryOutput.map((fileName) => Util.getPath(this.$pathToCheck, fileName));
    const filePathList = pathList.filter((path) => fs.statSync(path).isFile());
    const subDirectorys = pathList.filter((path) => fs.statSync(path).isDirectory());
    console.log('Found', subDirectorys.length, 'subdirectorys and', filePathList.length, 'files to check');

    const map = await this.readFileListAsBuffers(filePathList);
    const groupsOfSameFiles = await this.findDuplicatedFromMapedFileList(map);

    const formatedResults: IFileInfo[][] = groupsOfSameFiles.map((group): IFileInfo[] => {
      return group.map((elem) => {
        const filePath = filePathList[elem]!;

        return {
          name: filePath.split('/').pop() ?? '',
          path: filePath,
        };
      });
    });

    return formatedResults;
  }

  private async readFileListAsBuffers(filePathList: string[]): Promise<IMapedFile[]> {
    const timerLabel = `Read ${filePathList.length} files in`;
    console.time(timerLabel);
    const promises = filePathList.map((filePath) => fsPromise.readFile(filePath));
    const buffers = await Promise.all(promises);
    const map = filePathList.map((filePath, index): IMapedFile => ({
      path: filePath,
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
}
