import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { ProgressFinishEvent, ProgressFoundEvent, ProgressStartEvent, ProgressUpdateEvent } from '../../shared/events/base.events';
import { ReadStartEvent } from '../../shared/events/read.events';
import { CompareFinishEvent, CompareFoundEvent, CompareStartEvent, CompareUpdateEvent } from '../../shared/events/compare.events';
import { EventEmitter } from './event-emitter';
import { FileReader, IBufferResult, ICrcResult } from './file-reader';

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
  recursive: boolean;
}

export class DuplicationFinder {

  private readonly $fileReader: FileReader;
  private readonly $eventEmitter: EventEmitter;

  readonly events: {
    found$: Observable<ProgressFoundEvent>,
    finish$: Observable<ProgressFinishEvent>,
    update$: Observable<ProgressUpdateEvent>,
    start$: Observable<ProgressStartEvent>,
  };

  constructor(params: {
    pathToCheck: string;
    recursive: boolean;
    updateInterval: number;
  }) {
    if (params.pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$fileReader = new FileReader({
      directoyPath: params.pathToCheck,
      recursive: params.recursive,
    });

    this.$eventEmitter = new EventEmitter(params.updateInterval);
    this.events = {
      finish$: this.$eventEmitter.finish$,
      found$: this.$eventEmitter.found$,
      start$: this.$eventEmitter.start$,
      update$: this.$eventEmitter.update$,
    };
  }

  public async find(): Promise<string[][]> {
    const startTime = Date.now();
    this.$eventEmitter.start(new ReadStartEvent());
    const { files } = await this.$fileReader.read();

    this.$eventEmitter.start(new CompareStartEvent());
    const total = files.length;
    const sameFilesGroups = await this.findDuplicatedFromReadResult(files);

    const timeTaken = Date.now() - startTime;
    this.$eventEmitter.finish(new CompareFinishEvent({
      timeTaken,
      results: sameFilesGroups,
      // todo: get this from inner find methode
      completed: total,
      total,
    }));

    return sameFilesGroups;
  }

  private async findDuplicatedFromReadResult(list: IBufferResult[] | ICrcResult[]): Promise<string[][]> {
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
        this.$eventEmitter.found(new CompareFoundEvent({
          group: currentIterationSameFiles
        }));
      }

      this.$eventEmitter.update(new CompareUpdateEvent({
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
