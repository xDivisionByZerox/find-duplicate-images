import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { ProgressFinishEvent, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from '../../shared/events/base.events';
import { ReadStartEvent } from '../../shared/events/read.events';
import { CompareFinishEvent, CompareFoundEvent, CompareStartEvent, CompareUpdateEvent } from '../../shared/events/compare.events';
import { EventEmitter, EventMap } from './event-emitter';
import { FileFinder, IBufferResult, ICrcResult } from './file-finder';
import { readFile, stat } from 'fs/promises';
import { createHash } from 'crypto';
import { exists } from 'fs';

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
    const total = files.length;

    const startEvent = this.$eventEmitter.emitStart(new CompareStartEvent());
    const sameFilesGroups = await this.compareFromReadResult(files);
    this.$eventEmitter.emitFinish(new CompareFinishEvent({
      startTime: startEvent.startTime,
      results: sameFilesGroups,
      // todo: get this from inner find methode
      completed: total,
      total,
    }));

    return sameFilesGroups;
  }

  private async compareFromReadResult(filePathes: string[]): Promise<string[][]> {
    const hashMap = new Map<string, string>();
    const bufferPromises = filePathes.map(async (path) => {
      const buffer = await readFile(path);
      const hash = createHash('sha256').update(buffer).digest();
      const hashString = hash.toString('base64');
      hashMap.set(path, hashString);
    });
    await Promise.all(bufferPromises);

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
