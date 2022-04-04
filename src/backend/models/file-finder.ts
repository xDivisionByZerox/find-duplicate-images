import { readdir, stat } from 'fs/promises';
import { isAbsolute, join, normalize } from 'path';
import { ReadFinishEvent, ReadStartEvent } from '../../shared/events/read.events';
import { Logger } from './logger';
import { EventEmitter, EventMap } from './event-emitter';

export class FileFinder {

  private readonly $directoyPath: string;
  private readonly $logger: Logger;
  private readonly $recursive: boolean;

  private readonly $eventEmitter: EventEmitter<string>;
  readonly events: EventMap<string>;

  constructor(params: {
    directoyPath: string;
    log?: boolean;
    recursive?: boolean;
    updateInterval: number;
  }) {
    const {
      log: debug = false,
      directoyPath,
      recursive = false,
      updateInterval,
    } = params;

    if (!isAbsolute(directoyPath)) {
      throw new Error('"directoyPath" must be absolute.');
    }

    this.$logger = new Logger('FileFinder', debug);
    this.$directoyPath = directoyPath;
    this.$eventEmitter = new EventEmitter(updateInterval);
    this.$recursive = recursive;
    this.events = this.$eventEmitter.getEventMap();
  }

  async find(): Promise<string[]> {
    const startEvent = new ReadStartEvent();
    this.$eventEmitter.emitStart(startEvent);
    this.$logger.log('StartEvent:', startEvent);

    const { filePathes, subDirectorys, totalBytes } = await this.readDirectory(this.$directoyPath, this.$recursive);

    const endEvent = new ReadFinishEvent({
      startTime: startEvent.startTime,
      files: filePathes.length,
      subDirectories: subDirectorys.length,
      totalBytes,
    });
    this.$eventEmitter.emitFinish(endEvent);
    this.$logger.log('EndEvent:', endEvent);

    return filePathes;
  }

  private async readDirectory(directoyPath: string, recursive: boolean) {
    const filePathes: string[] = [];
    const subDirectorys: string[] = [];
    let totalBytes = 0;


    this.$logger.log('read:', directoyPath);
    const directoryOutput = await readdir(directoyPath);
    const promises = directoryOutput.map(async (fileName) => {
      const fullPath = normalize(join(directoyPath, fileName));
      const stats = await stat(fullPath);

      const isFile = stats.isFile();
      const isImage = this.isImageFile(fullPath);
      const isDirectory = stats.isDirectory();
      if (isFile && isImage) {
        filePathes.push(fullPath);
        totalBytes = totalBytes + stats.size;
      } else if (isDirectory) {
        subDirectorys.push(fullPath);
      }
    });
    await Promise.allSettled(promises);

    if (recursive) {
      // copy `subDirectorys` to not override it while mapping
      const subDirectoryPromises = [...subDirectorys].map(async (subDir) => {
        const result = await this.readDirectory(subDir, recursive);
        subDirectorys.push(...result.subDirectorys);
        filePathes.push(...result.filePathes);
        totalBytes = totalBytes + result.totalBytes;
      });
      await Promise.allSettled(subDirectoryPromises);
    }

    return {
      filePathes,
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
