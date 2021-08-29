import fsPromise from 'fs/promises';
import { freemem } from 'os';
import { CRC } from './crc';

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
  private readonly $filePathList: string[];
  private readonly $totalBytes: number;

  constructor(filePathList: string[], totalBytes: number) {
    this.$filePathList = filePathList;
    this.$totalBytes = totalBytes;
  }

  async read(): Promise<IBufferResult[] | ICrcResult[]> {
    const freeBytes = freemem();
    // 0.5 GiB
    const memoryBuffer = 0.5 * Math.pow(1024, 3);
    if (this.$totalBytes < freeBytes - memoryBuffer) {
      return this.asBufferMap();
    }

    return this.asCrc32Map();
  }

  async asCrc32Map(): Promise<ICrcResult[]> {
    const mapedList: ICrcResult[] = [];

    // split file list into sub lists to not overstep max memory usage while reading a bunch of buffers
    // todo: make part size dynamic based on free memory (use freemem imported by os)
    const partSize = 1024;
    const max = this.$filePathList.length - 1;
    for (let i = 0; i <= max; i += partSize) {
      const currList = this.$filePathList.slice(i, i + partSize);

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
          result: this.$crcHelper.generate(buffer.toString()),
          path: this.$filePathList[fileIndex]!,
        });
      }
    }

    return mapedList;
  }

  async asBufferMap(): Promise<IBufferResult[]> {
    interface IBufferMapedIndex {
      buffer: Buffer;
      fileIndex: number;
    }

    const promises = this.$filePathList.map((filePath, index) => fsPromise.readFile(filePath).then((res) => ({
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
      path: this.$filePathList[maped.fileIndex]!,
    }));

    return map;
  }
}
