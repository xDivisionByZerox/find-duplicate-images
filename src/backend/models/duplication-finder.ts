import { createHash } from 'crypto';
import { readFileSync } from 'fs';
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

  find(files: string[]): string[][] {
    const totalFileNumber = files.length;

    const startEvent = this.$eventEmitter.emitStart(new CompareStartEvent());

    // [hash, filePathes]
    const hashMap = new Map<string, string[]>();
    let interations = 0;

    for (const path of files) {
      const hash = this.getFileContentHash(path);
      const existing = hashMap.get(hash);
      if (existing !== undefined) {
        existing.push(path);
        this.$eventEmitter.emitFound(new CompareFoundEvent({
          group: existing,
        }));
      } else {
        hashMap.set(hash, [path]);
      }

      interations = interations + 1;
      this.$eventEmitter.emitUpdate(new CompareUpdateEvent({
        completed: interations,
        total: totalFileNumber,
      }));
    }

    const duplicates = [...hashMap.values()].filter((elem) => elem.length > 1);

    this.$eventEmitter.emitFinish(new CompareFinishEvent({
      startTime: startEvent.startTime,
      results: duplicates,
      // todo: get this from inner find methode
      completed: totalFileNumber,
      total: totalFileNumber,
    }));

    return duplicates;
  }

  private getFileContentHash(filePath: string): string {
    const buffer = readFileSync(filePath);
    const hash = createHash('sha256')
      .update(buffer)
      .digest('hex');

    return hash;
  }

}
