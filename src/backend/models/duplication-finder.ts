import { Subject } from 'rxjs';
import { DuplicationProgressFinishedEvent, DuplicationProgressFoundEvent, DuplicationProgressStartEvent, DuplicationProgressUpdateEvent } from '../../shared/events';
import { FileReader, IBufferResult, ICrcResult } from './file-reader';

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
  recursive: boolean;
}

export class DuplicationFinder {

  private readonly $fileReader: FileReader;
  private readonly $updateInterval: number;

  private readonly $start$ = new Subject<DuplicationProgressStartEvent>();
  readonly start$ = this.$start$.asObservable();

  private readonly $update$ = new Subject<DuplicationProgressUpdateEvent>();
  readonly update$ = this.$update$.asObservable();

  private readonly $found$ = new Subject<DuplicationProgressFoundEvent>();
  readonly found$ = this.$found$.asObservable();

  private readonly $finish$ = new Subject<DuplicationProgressFinishedEvent>();
  readonly finish$ = this.$finish$.asObservable();

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

    this.$updateInterval = params.updateInterval;
  }

  public async find(): Promise<string[][]> {
    const startTime = Date.now();
    this.$start$.next(new DuplicationProgressStartEvent('read'));
    const { files } = await this.$fileReader.read();
    
    this.$start$.next(new DuplicationProgressStartEvent('compare'));
    const sameFilesGroups = await this.findDuplicatedFromReadResult(files);

    const timeTaken = Date.now() - startTime;
    this.$finish$.next(new DuplicationProgressFinishedEvent({
      timeTaken,
      results: sameFilesGroups,
      // todo: get this from inner find methode
      completed: files.length,
      total: files.length,
    }));

    return sameFilesGroups;
  }

  private update(event: DuplicationProgressUpdateEvent): void {
    if (event.completed % this.$updateInterval !== 0) {
      return;
    }

    this.$update$.next(event);
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
        this.$found$.next(new DuplicationProgressFoundEvent(currentIterationSameFiles))
      }

      this.update(new DuplicationProgressUpdateEvent({
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
