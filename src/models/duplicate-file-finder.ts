import fs from 'fs';
import fsPromise from 'fs/promises';
import { IFileInfo } from '..';
import { FileReader } from './file-reader';
import { Timer } from './timer';
import { Util } from './util';

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
    const { filePathList, subDirectorys, totalBytes } = await this.findElementsInDir(this.$pathToCheck);
    const totalMb = totalBytes / Math.pow(1024, 2);
    console.log('Found', filePathList.length, 'files in', subDirectorys.length, 'subdirectories.');
    console.log('Total size:', totalMb.toFixed(2), 'mB');
    console.log('Start searching for duplicates.')

    const readResult = await new FileReader(filePathList, totalBytes).read();
    const groupsOfSameFiles = await this.findDuplicatedFromReadResult(readResult.map((elem) => elem.result))

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
    let totalBytes = 0;
    for (const path of pathList) {
      const stat = fs.statSync(path);
      if (stat.isFile() && this.isImageFile(path)) {
        filePathList.push(path);
        totalBytes = totalBytes + stat.size;
      } else if (stat.isDirectory()) {
        subDirectorys.push(path);
      }
    }

    for (const subDir of subDirectorys) {
      const result = await this.findElementsInDir(subDir);
      filePathList.push(...result.filePathList);
      totalBytes = totalBytes + result.totalBytes;
    }

    return {
      filePathList,
      subDirectorys,
      totalBytes,
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

  private async findDuplicatedFromReadResult(list: (number | Buffer)[]): Promise<[number, number][]> {
    return new Timer(`Compared ${list.length} files in`).run(() => {
      const groupsOfSameFiles: [number, number][] = [];
      for (let i = 0; i < list.length - 1; i++) {
        const res1 = list[i];
        if(res1 === undefined) {
          continue;
        }

        for (let k = i + 1; k < list.length - 1; k++) {
          const res2 = list[k];
          if(res2 === undefined) {
            continue;
          }

          if (res1 instanceof Buffer && res2 instanceof Buffer) {
            if(!res1.equals(res2)) {
              continue;
            }
          }

          if (typeof res1 === 'number' && typeof res2 === 'number') {
            if(res1 !== res2) {
              continue;
            }
          }
          // results can both only be from type number or buffer 

          const isIn = groupsOfSameFiles.find((elem) => elem.includes(i) && elem.includes(k));
          if (isIn) {
            continue;
          }

          groupsOfSameFiles.push([i, k]);
        }
      }

      console.log('Found', groupsOfSameFiles.length, 'possible duplicates');

      return groupsOfSameFiles;
    });
  }

}
