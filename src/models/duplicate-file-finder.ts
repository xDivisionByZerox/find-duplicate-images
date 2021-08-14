import fs from 'fs';
import fsPromise from 'fs/promises';
import { IFileInfo } from '..';
import { Timer } from './timer';
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
    return new Timer(`Read ${filePathList.length} files in`).run(async () => {
      interface IBufferMapedIndex {
        buffer: Buffer;
        fileIndex: number;
      }

      const promises = filePathList.map((filePath, index) => fsPromise.readFile(filePath).then((res) => ({
        buffer: res,
        fileIndex: index,
      })));
      const settled = await Promise.allSettled(promises);
      const mapedBuffers: IBufferMapedIndex[] = [];
      for (const res of settled) {
        if (res.status === 'fulfilled') {
          mapedBuffers.push(res.value);
        }
      }

      const map = mapedBuffers.map((maped): IMapedFile => ({
        buffer: maped.buffer,
        path: filePathList[maped.fileIndex]!,
      }));

      return map;
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
      console.log('Found', groupsOfSameFiles.length, 'possible duplicates');
  
      return groupsOfSameFiles;
    });
  }
}
