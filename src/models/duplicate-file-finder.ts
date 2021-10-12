import { ArgumentParser } from './argument-parser';
import { FileReader } from './file-reader';
import { Timer } from './timer';

export interface IDuplicateFileFinderConstructor {
  pathToCheck: string;
  recursive: boolean;
}

export class DuplicateFileFinder {

  private readonly $pathToCheck: string;
  private readonly $recursive: boolean;

  constructor() {
    const config = ArgumentParser.parseFindArguments();
    if (config.pathToCheck.length <= 0) {
      throw new Error('"pathToCheck" cannot be empty.');
    }

    this.$pathToCheck = config.pathToCheck;
    this.$recursive = config.recursive;
  }

  public async find(): Promise<string[][]> {
    const { files, filePathes } = await new FileReader().read(this.$pathToCheck, this.$recursive);
    // for some reason the signatures are not compatible on this map
    // @ts-ignore
    const mapedResult = files.map((elem) => elem.result);
    const sameFilesGroups = await this.findDuplicatedFromReadResult(mapedResult);

    const formatedResults: string[][] = sameFilesGroups.map((group) => group.map((elem) => filePathes[elem]!));

    return formatedResults;
  }
  private async findDuplicatedFromReadResult(list: (number | Buffer)[]): Promise<number[][]> {
    return new Timer(`Compared ${list.length} files in`).run(() => {
      const sameFileMap: Record<number, number[]> = {};
      const totalFiles = list.length;
      let totalIteration = 0;
      while (list.length > 0) {
        totalIteration++;
        if (totalIteration % 1e3 === 0) {
          console.log('processed', totalIteration, '/', totalFiles, 'files');
        }

        const currentIndex = list.length - 1;
        const current = list.pop();
        if (current === undefined) {
          continue;
        }

        let removes = 0;
        for (let compareIndex = 0; compareIndex <= list.length - 1; compareIndex++) {
          const compare = list[compareIndex];
          if (compare === undefined) {
            continue;
          }

          if (!this.isSame(current, compare)) {
            continue;
          }

          const existingValue = sameFileMap[currentIndex];
          const realListIndex = compareIndex + removes;
          if (existingValue === undefined) {
            sameFileMap[currentIndex] = [realListIndex];
          } else {
            existingValue.push(realListIndex);
          }

          list.splice(compareIndex, 1);
          compareIndex--;
          removes++;
        }
      }

      console.log('Found', Object.keys(sameFileMap).length, 'possible duplications');

      return Object.entries(sameFileMap).map(([key, value]) => {
        value.push(parseInt(key));
        return value;
      });
    });
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
