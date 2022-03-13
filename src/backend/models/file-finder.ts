import { Stats } from 'fs';
import fsPromise from 'fs/promises';
import { isAbsolute, join, normalize } from 'path';
import { EReadFoundType, ReadFinishEvent, ReadFoundEvent, ReadStartEvent } from '../../shared/events/read.events';
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
  };

}
