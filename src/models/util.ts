import path from 'path';

export abstract class Util {

  static getPath(...pathes: string[]): string {
    return path.normalize(path.join(...pathes));
  }

  static isKeyof<T>(e: T) {
    return function (token: string | number | symbol): token is (keyof T) {
      return Object.keys(e).includes(token.toString());
    }
  }

  static isObject<T extends Record<string, any>>(value: unknown): value is Partial<T> {
    return (
      typeof value === 'object'
      && value !== undefined
    );
  }

}
