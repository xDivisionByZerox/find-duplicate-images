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
    const sameFilesGroups = this.compareFromReadResult(files);
    this.$eventEmitter.emitFinish(new CompareFinishEvent({
      startTime: startEvent.startTime,
      results: sameFilesGroups,
      // todo: get this from inner find methode
      completed: totalFileNumber,
      total: totalFileNumber,
    }));

    return sameFilesGroups;
  }

  private compareFromReadResult(filePathes: string[]): string[][] {
    // [hash, filePathes]
    const hashMap = new Map<string, string[]>();
    let interations = 0;

    for (const path of filePathes) {
      const buffer = readFileSync(path);
      const hash = createHash('sha256')
        .update(buffer)
        .digest('hex');
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
        total: filePathes.length,
      }));
    }

    const duplicates = [...hashMap.values()].filter((elem) => elem.length > 1);

    return duplicates;
  }

}
