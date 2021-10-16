import { statSync } from 'fs';
import fsPromise from 'fs/promises';
import { freemem } from 'os';
import { CRC } from './crc';
import { Util } from './util';

export interface ICrcResult {
  path: string;
  result: number;
}

export interface IBufferResult {
  path: string;
  result: Buffer;
}

export class FileReader {

  private readonly $crcHelper = new CRC();
  private readonly $directoyPath: string;
  private readonly $recursive: boolean;

  constructor(params: {
    directoyPath: string;
    recursive?: boolean;
  }) {
    const {
      directoyPath,
      recursive = false,
    } = params;

    this.$directoyPath = directoyPath;
    this.$recursive = recursive;
  }

  async read(): Promise<{
    files: IBufferResult[] | ICrcResult[],
    filePathes: string[],
  }> {
    const { filePathList, totalBytes } = await this.findElements();
    const files = await this.readFromPathes(filePathList, totalBytes);

    return {
      files,
      filePathes: filePathList,
    };
  }

  private async findElements() {
    const { filePathList, subDirectorys, totalBytes } = await this.readDirectory(this.$directoyPath, this.$recursive);
    const totalMb = totalBytes / Math.pow(1024, 2);

    console.log('Found', filePathList.length, 'files');
    const param = this.$recursive ? 'Deeply searched' : 'Ignored';
    console.log(param, subDirectorys.length, 'subdirectories.');
    console.log('Total size:', totalMb.toFixed(2), 'mB');
    console.log('Start searching for duplicates.');

    return { filePathList, totalBytes };
  }

  private async readDirectory(directoyPath: string, recursive = false) {
    const directoryOutput = await fsPromise.readdir(directoyPath);
    const pathList = directoryOutput.map((fileName) => Util.getPath(directoyPath, fileName));

    const filePathList: string[] = [];
    const subDirectorys: string[] = [];
    let totalBytes = 0;
    for (const path of pathList) {
      const stat = statSync(path);
      if (stat.isFile() && this.isImageFile(path)) {
        filePathList.push(path);
        totalBytes = totalBytes + stat.size;
      } else if (stat.isDirectory()) {
        subDirectorys.push(path);
      }
    }

    if (recursive) {
      for (const subDir of subDirectorys) {
        const result = await this.readDirectory(subDir, recursive);
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

  private async readFromPathes(filePaths: string[], totalBytes: number) {
    const freeBytes = freemem();
    const memoryBufferGiB = 0.5 * Math.pow(1024, 3);
    if (totalBytes < freeBytes - memoryBufferGiB) {
      return this.asBufferMap(filePaths);
    }

    console.log('Total file size will exceed available.');
    console.log('Will use file hashing algorithm. This will run much slower.');
    console.log('To speed up this process, search in directorys with not that many files at the same time.');

    return this.asCrc32Map(filePaths);
  }

  private async asCrc32Map(filePaths: string[]): Promise<ICrcResult[]> {
    const mapedList: ICrcResult[] = [];

    // split file list into sub lists to not overstep max memory usage while reading a bunch of buffers
    // todo: make part size dynamic based on free memory (use freemem imported by os)
    const partSize = 1024;
    const max = filePaths.length - 1;
    let finished = 0;
    for (let i = 0; i <= max; i += partSize) {
      const currList = filePaths.slice(i, i + partSize);

      const promises: Promise<void>[] = [];
      for (let fileIndex = 0; fileIndex <= currList.length - 1; fileIndex++) {
        const path = currList[fileIndex]!;
        const promise = fsPromise.readFile(path).then((buffer) => {
          mapedList.push({
            result: this.$crcHelper.generate(buffer.toString()),
            path,
          });
        });
        promises.push(promise);
      }

      const settled = await Promise.allSettled(promises);
      finished += settled.filter((elem) => elem.status === 'fulfilled').length;

      console.log('Processed', finished, '/', filePaths.length, 'images');
    }

    return mapedList;
  }

  private async asBufferMap(filePaths: string[]): Promise<IBufferResult[]> {
    interface IBufferMapedIndex {
      buffer: Buffer;
      fileIndex: number;
    }

    const promises = filePaths.map((filePath, index) => fsPromise.readFile(filePath).then((res) => ({
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

    const map = mapedBuffers.map((maped): IBufferResult => ({
      result: maped.buffer,
      path: filePaths[maped.fileIndex]!,
    }));

    return map;
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


}
