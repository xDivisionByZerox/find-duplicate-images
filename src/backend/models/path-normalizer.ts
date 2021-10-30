import path from 'path';

export function getPath(...pathes: string[]): string {
  return path.normalize(path.join(...pathes));
}