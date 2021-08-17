import fs from 'fs';
import fsPromise from 'fs/promises';
import { IFileInfo } from '..';
import { CRC } from './crc';
import { Timer } from './timer';
import { Util } from './util';

interface IMapedFile {
  path: string;
  crc32: number;
}

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
}

export class DuplicateFileFinder {

  private readonly $pathToCheck: string;
  private readonly $crcHelper = new CRC();

  constructor(params: IDuplicateFileFinderConstructor) {
    const { pathToCheck } = params;
    if (pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$pathToCheck = pathToCheck;
  }

  public async find(): Promise<IFileInfo[][]> {
    const { filePathList, subDirectorys } = await this.findElementsInDir(this.$pathToCheck);
    console.log('Found', filePathList.length, 'files in', subDirectorys.length, 'subdirectories.');
    console.log('Start searching for duplicates.')

    const map = await this.hashFileList(filePathList);
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

  private async findElementsInDir(givenPath: string) {
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
      const result = await this.findElementsInDir(subDir);
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

  private async hashFileList(filePathList: string[]): Promise<IMapedFile[]> {
    return new Timer(`Hashed ${filePathList.length} files in`).run(async () => {
      const mapedList: IMapedFile[] = [];

      // split file list into sub lists to not overstep max memory usage while reading a bunch of buffers
      // todo: make part size dynamic based on free memory (use freemem imported by os)
      const partSize = 1024;
      for (let i = 0; i <= filePathList.length - 1; i += partSize) {
        const currList = filePathList.slice(i, i + partSize);

        const promises: Promise<{
          buffer: Buffer;
          fileIndex: number;
        }>[] = [];
        for (let fileIndex = 0; fileIndex <= currList.length - 1; fileIndex++) {
          const promise = fsPromise.readFile(currList[fileIndex]!).then((buffer) => ({ buffer, fileIndex }));
          promises.push(promise);
        }

        const settled = await Promise.allSettled(promises);
        for (const res of settled) {
          if (res.status !== 'fulfilled') {
            continue;
          }

          const { buffer, fileIndex } = res.value;
          mapedList.push({
            crc32: this.$crcHelper.generate(buffer.toString()),
            path: filePathList[fileIndex]!,
          });
        }
      }

      return mapedList;
    });
  }

  private async findDuplicatedFromMapedFileList(list: IMapedFile[]): Promise<[number, number][]> {
    return new Timer(`Compared ${list.length} files in`).run(() => {
      const groupsOfSameFiles: [number, number][] = [];
      list.forEach((file, i) => {
        list.forEach((file2, k) => {
          if (i === k) {
            return;
          }

          if (file.crc32 !== file2.crc32) {
            return;
          }

          const isIn = groupsOfSameFiles.find((elem) => elem.includes(i) && elem.includes(k));
          if (isIn) {
            return;
          }

          groupsOfSameFiles.push([i, k]);
        });
      });
      console.log('Found', groupsOfSameFiles.length, 'possible duplicates');

      return groupsOfSameFiles;
    });
  }
}
