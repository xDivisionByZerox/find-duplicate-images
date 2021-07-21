import path from 'path';

export abstract class Util {

  static getPath(...pathes: string[]): string {
    return path.normalize(path.join(...pathes));
  }

}
