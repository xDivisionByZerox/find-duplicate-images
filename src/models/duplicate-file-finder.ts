import fs from 'fs';
import fsPromise from 'fs/promises';
import { IFileInfo } from '..';
import { defaultConfig } from '../default-config';
import { Util } from './util';

interface IMapedFile {
  name: string;
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
    const fileList = directoryOutput.filter((name) => fs.statSync(Util.getPath(this.$pathToCheck, name)).isFile());
    const subDirectorys = directoryOutput.filter((name) => fs.statSync(Util.getPath(this.$pathToCheck, name)).isDirectory());
    console.log('Found', subDirectorys.length, 'subdirectorys and', fileList.length, 'files to check');

    const map = await this.readFileListAsBuffers(fileList);
    const groupsOfSameFiles = await this.findDuplicatedFromMapedFileList(map);

    const formatedResults: IFileInfo[][] = groupsOfSameFiles.map((group): IFileInfo[] => {
      return group.map((elem) => {
        const fileName = fileList[elem]!;

        return {
          name: fileName,
          path: Util.getPath(defaultConfig.pathToCheck, fileName),
        };
      });
    });

    return formatedResults;
  }

  private async readFileListAsBuffers(fileList: string[]): Promise<IMapedFile[]> {
    const timerLabel = `Read ${fileList.length} files in`;
    console.time(timerLabel);
    const promises = fileList.map((name) => fsPromise.readFile(Util.getPath(defaultConfig.pathToCheck, name)));
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
}
