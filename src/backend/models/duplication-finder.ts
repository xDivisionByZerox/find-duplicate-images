import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { CompareFinishEvent, CompareFoundEvent, CompareStartEvent, CompareUpdateEvent } from '../../shared/events/compare.events';
import { EventEmitter, EventMap } from './event-emitter';

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
  recursive: boolean;
}

export class DuplicationFinder {

  private readonly $eventEmitter: EventEmitter<string[]>;
  readonly events: EventMap<string[]>;

  constructor(params: {
    updateInterval: number;
  }) {
    this.$eventEmitter = new EventEmitter(params.updateInterval);
    this.events = this.$eventEmitter.getEventMap();
  }

  async find(files: string[]): Promise<string[][]> {
    const totalFileNumber = files.length;

    const startEvent = this.$eventEmitter.emitStart(new CompareStartEvent());
    const sameFilesGroups = await this.compareFromReadResult(files);
    this.$eventEmitter.emitFinish(new CompareFinishEvent({
      startTime: startEvent.startTime,
      results: sameFilesGroups,
      // todo: get this from inner find methode
      completed: totalFileNumber,
      total: totalFileNumber,
    }));

    return sameFilesGroups;
  }

  private async compareFromReadResult(filePathes: string[]): Promise<string[][]> {
    const chunkSize = 1000;
    const groups: string[][] = [];
    // todo, research max file opens os specific
    // create goups to prevent https://github.com/nodejs/node/issues/4386 from happening
    for (let i = 0; i < filePathes.length; i += chunkSize) {
      const temp = filePathes.slice(i, i + chunkSize);
      groups.push(temp);
    }

    const hashMap = new Map<string, string>();
    for (const group of groups) {
      const promises = group.map(async (path) => {
        const buffer = await readFile(path);
        const hash = createHash('sha256').update(buffer).digest('hex');
        hashMap.set(path, hash);
      });
      await Promise.allSettled(promises);
    }

    const duplicateMap = new Map<string, string[]>();
    let interations = 0;
    for (const [path, hash] of hashMap.entries()) {
      interations++;

      const existing = duplicateMap.get(hash);
      if (existing) {
        existing.push(path);
        this.$eventEmitter.emitFound(new CompareFoundEvent({
          group: existing,
        }));
      } else {
        duplicateMap.set(hash, [path]);
      }

      this.$eventEmitter.emitUpdate(new CompareUpdateEvent({
        completed: interations,
        total: filePathes.length,
      }));
    }

    const duplicates = Array.from(duplicateMap.values()).filter((elem) => elem.length > 1);

    return duplicates;
  }

}
