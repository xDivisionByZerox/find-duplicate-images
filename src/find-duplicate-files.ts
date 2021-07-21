import { DuplicateFileFinder, IDuplicateFileFinderConstructor } from './duplicate-file-finder';
import { IResultHandlerConstructor, ResultHandler } from './result-handler';
import { Util } from './util';

export interface IMapedFile {
  name: string;
  buffer: Buffer;
}

export interface IFileInfo {
  name: string;
  path: string;
}

type Config = IResultHandlerConstructor & IDuplicateFileFinderConstructor;

// dynamic
export const config: Config = {
  pathToCheck: 'D:\\OneDrive\\Bilder',
  htmlFileName: 'index.html',
  jsFileName: 'data.js',
  outputDir: Util.getPath(__dirname, 'duplicate-files'),
};

(async () => {
  try {
    const results = await new DuplicateFileFinder({ pathToCheck: config.pathToCheck }).find();
    await new ResultHandler({
      htmlFileName: config.htmlFileName,
      jsFileName: config.jsFileName,
      outputDir: config.outputDir,
    }).ouputResults(results);
  } catch (error) {
    console.log('could not resolve duplicate files');
    console.log(error);
  }
})();