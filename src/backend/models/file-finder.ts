import { Stats, statSync } from 'fs';
import fsPromise from 'fs/promises';
import { freemem } from 'os';
import { isAbsolute, normalize, join } from 'path';
import { EReadFoundType, ReadFinishEvent, ReadFoundEvent, ReadStartEvent } from '../../shared/events/read.events';
import { CRC } from './crc';
import { EventEmitter, EventMap } from './event-emitter';

export interface ICrcResult {
  path: string;
  result: number;
}

export interface IBufferResult {
  path: string;
  result: Buffer;
}

type StatsWithPath = {
  stat: Stats;
  path: string;
};

export class FileFinder {

  private readonly $crcHelper = new CRC();
  private readonly $directoyPath: string;
  private readonly $recursive: boolean;

  private readonly $eventEmitter: EventEmitter<string>;
  readonly events: EventMap<string>;

  constructor(params: {
    directoyPath: string;
    recursive?: boolean;
    updateInterval: number;
  }) {
    const {
      directoyPath,
      recursive = false,
      updateInterval,
    } = params;

    if (!isAbsolute(directoyPath)) {
      throw new Error('"directoyPath" must be absolute.');
    }

    this.$directoyPath = directoyPath;
    this.$recursive = recursive;
    this.$eventEmitter = new EventEmitter(updateInterval);
    this.events = this.$eventEmitter.getEventMap();
  }

  async find(): Promise<string[]> {
    const startEvent = this.$eventEmitter.emitStart(new ReadStartEvent());
    const { filePathList } = await this.readDirectory(this.$directoyPath, this.$recursive);
    this.$eventEmitter.emitFinish(new ReadFinishEvent({
      startTime: startEvent.startTime,
      completed: filePathList.length,
      total: filePathList.length,
    }));

    return filePathList;
  }

  private async readDirectory(directoyPath: string, recursive = false) {
    const directoryOutput = await fsPromise.readdir(directoyPath);
    const statsPromises = directoryOutput.map(async (fileName) => {
      const fullPath = join(directoyPath, fileName);
      const normalizedFullPath = normalize(fullPath);

      return fsPromise.stat(normalizedFullPath).then((result): StatsWithPath => ({
        stat: result,
        path: normalizedFullPath,
      }));
    });
    const statsSettled = await Promise.allSettled(statsPromises);
    const statsFullFilled = statsSettled.filter((elem): elem is PromiseFulfilledResult<StatsWithPath> => elem.status === 'fulfilled');
    const stats = statsFullFilled.map((elem) => elem.value);

    const filePathList: string[] = [];
    const subDirectorys: string[] = [];
    let totalBytes = 0;
    for (const { stat, path } of stats) {
      if (stat.isFile() && this.isImageFile(path)) {
        filePathList.push(path);
        totalBytes = totalBytes + stat.size;
        this.$eventEmitter.emitFound(new ReadFoundEvent({
          group: path,
          type: EReadFoundType.FILE,
        }));
      } else if (stat.isDirectory()) {
        subDirectorys.push(path);
        this.$eventEmitter.emitFound(new ReadFoundEvent({
          group: path,
          type: EReadFoundType.SUBDIRECTORY,
        }));
      }
    }

    if (recursive) {
      const subDirectoryPromises = subDirectorys.map(async (subDir) => {
        const result = await this.readDirectory(subDir, recursive);
        filePathList.push(...result.filePathList);
        totalBytes = totalBytes + result.totalBytes;
      });
      await Promise.allSettled(subDirectoryPromises);
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
