import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { ProgressFinishEvent, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from '../../shared/events/base.events';
import { ReadStartEvent } from '../../shared/events/read.events';
import { CompareFinishEvent, CompareFoundEvent, CompareStartEvent, CompareUpdateEvent } from '../../shared/events/compare.events';
import { EventEmitter, EventMap } from './event-emitter';
import { FileReader, IBufferResult, ICrcResult } from './file-reader';

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

  async find(files: IBufferResult[] | ICrcResult[]): Promise<string[][]> {
    console.log('start comparing');
    const startEvent = this.$eventEmitter.emitStart(new CompareStartEvent());

    const total = files.length;
    const sameFilesGroups = await this.compareFromReadResult(files);

    this.$eventEmitter.emitFinish(new CompareFinishEvent({
      startTime: startEvent.startTime,
      results: sameFilesGroups,
      // todo: get this from inner find methode
      completed: total,
      total,
    }));
    console.log('finished comparing');

    return sameFilesGroups;
  }

  private async compareFromReadResult(list: IBufferResult[] | ICrcResult[]): Promise<string[][]> {
    const sameFiles: string[][] = [];
    const totalFiles = list.length;
    let totalIteration = 0;
    while (list.length > 0) {
      totalIteration++;

      const current = list.pop();
      if (current === undefined) {
        continue;
      }

      const currentIterationSameFiles: string[] = [current.path];
      for (let compareIndex = 0; compareIndex <= list.length - 1; compareIndex++) {
        const compare = list[compareIndex];
        if (compare === undefined) {
          continue;
        }

        if (!this.isSame(current.result, compare.result)) {
          continue;
        }

        currentIterationSameFiles.push(compare.path);
        list.splice(compareIndex, 1);
        compareIndex--;
      }

      if (currentIterationSameFiles.length > 1) {
        sameFiles.push(currentIterationSameFiles);
        this.$eventEmitter.emitFound(new CompareFoundEvent({
          group: currentIterationSameFiles
        }));
      }

      this.$eventEmitter.emitUpdate(new CompareUpdateEvent({
        completed: totalIteration,
        total: totalFiles,
      }));
    }

    return sameFiles;
  }

  private isSame(value1: number | Buffer, value2: number | Buffer): boolean {
    return (
      (
        value1 instanceof Buffer
        && value2 instanceof Buffer
        && value1.equals(value2)
      )
      || (
        typeof value1 === 'number'
        && typeof value2 === 'number'
        && value1 === value2
      )
    )
  }

}
