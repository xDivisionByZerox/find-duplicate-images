import fs from 'fs';
import fsPromise from 'fs/promises';
import { FileReader } from './file-reader';
import { Timer } from './timer';
import { Util } from './util';

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
  recursive: boolean;
}

export class DuplicateFileFinder {

  private readonly $pathToCheck: string;
  private readonly $recursive: boolean;

  constructor(params: IDuplicateFileFinderConstructor) {
    const { pathToCheck } = params;
    if (pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$pathToCheck = pathToCheck;
    this.$recursive = params.recursive;
  }

  public async find(): Promise<string[][]> {
    const { filePathList, subDirectorys, totalBytes } = await this.findElementsInDir(this.$pathToCheck);
    const totalMb = totalBytes / Math.pow(1024, 2);

    console.log('Found', filePathList.length, 'files');
    if(this.$recursive) {
      console.log('Deeply searched', subDirectorys.length, 'subdirectories.');
    } else {      
      console.log('Ignored', subDirectorys.length, 'subdirectories.');
    }
    console.log('Total size:', totalMb.toFixed(2), 'mB');
    console.log('Start searching for duplicates.')

    const readResult = await new FileReader(filePathList, totalBytes).read();
    // for some reason the signatures are not compatible on this map
    // @ts-ignore
    const mapedResult = readResult.map((elem) => elem.result);
    const sameFilesGroups = await this.findDuplicatedFromReadResult(mapedResult);

    const formatedResults: string[][] = sameFilesGroups.map((group) => group.map((elem) => filePathList[elem]!));

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

    if (this.$recursive) {
      for (const subDir of subDirectorys) {
        const result = await this.findElementsInDir(subDir);
        filePathList.push(...result.filePathList);
        totalBytes = totalBytes + result.totalBytes;
      }
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

  private async findDuplicatedFromReadResult(list: (number | Buffer)[]): Promise<number[][]> {
    return new Timer(`Compared ${list.length} files in`).run(() => {
      const sameFileMap: Record<number, number[]> = {};
      const totalFiles = list.length;
      let topIteration = 0;
      while (list.length > 0) {
        topIteration++;
        if (topIteration % 1e3 === 0) {
          console.log('processed', topIteration, '/', totalFiles, 'files');
        }

        const currentIndex = list.length - 1;
        const current = list.pop();
        if (current === undefined) {
          continue;
        }

        let removes = 0;
        for (let compareIndex = 0; compareIndex <= list.length - 1; compareIndex++) {
          const compare = list[compareIndex];
          if (compare === undefined) {
            continue;
          }

          if (!this.isSame(current, compare)) {
            continue;
          }

          const existingValue = sameFileMap[currentIndex];
          const realListIndex = compareIndex + removes;
          if (existingValue === undefined) {
            sameFileMap[currentIndex] = [realListIndex];
          } else {
            existingValue.push(realListIndex);
          }

          list.splice(compareIndex, 1);
          compareIndex--;
          removes++;
        }
      }

      console.log('Found', Object.keys(sameFileMap).length, 'possible duplications');

      return Object.entries(sameFileMap).map(([key, value]) => {
        value.push(parseInt(key));
        return value;
      });
    });
  }

  private isSame(value1: number | Buffer, value2: number | Buffer): boolean {
    return (
      (
        value1 instanceof Buffer
        && value2 instanceof Buffer
        && value1.equals(value2)
      )
      || (
        typeof value1 === 'number'
        && typeof value2 === 'number'
        && value1 === value2
      )
    )
  }

}
