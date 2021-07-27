import { IDuplicateFileFinderConstructor } from './models/duplicate-file-finder';
import { IResultHandlerConstructor } from './models/result-handler';
import { Util } from './models/util';

type Config = IResultHandlerConstructor & IDuplicateFileFinderConstructor;

// dynamic
export const defaultConfig: Config = {
  pathToCheck: 'D:\\OneDrive\\Bilder',
  htmlFileName: 'index.html',
  jsFileName: 'data.js',
  outputDir: Util.getPath(__dirname, 'duplicate-files'),
};