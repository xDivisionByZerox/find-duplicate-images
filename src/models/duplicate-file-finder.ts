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
    const { filePathList, subDirectorys } = await this.findFiles(this.$pathToCheck);
    console.log('Found', filePathList.length, 'files in', subDirectorys.length, 'subdirectories.');
    console.log('Start searching for duplicates.')

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

  private async findFiles(givenPath: string) {
    const directoryOutput = await fsPromise.readdir(givenPath);
    const pathList = directoryOutput.map((fileName) => Util.getPath(givenPath, fileName));

    const filePathList: string[] = [];
    const subDirectorys: string[] = [];
    for (const path of pathList) {
      const stat = fs.statSync(path);
      if (stat.isFile() && this.isImageFile(path)) {
        filePathList.push(path);
      } else if (stat.isDirectory()) {
        subDirectorys.push(path);
      }
    }

    for (const subDir of subDirectorys) {
      const result = await this.findFiles(subDir);
      filePathList.push(...result.filePathList);
    }

    return {
      filePathList,
      subDirectorys,
    };
  }

  private isImageFile = (path: string): boolean => {
    const extension = path.split('.').pop();
    if (extension === undefined) {
      return false;
    }

    return [
      'bmp',
      'gif',
      'jpeg',
      'jpg',
      'png',
      'raw',
      'tif',
      'tiff',
    ].includes(extension.toLowerCase());
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
