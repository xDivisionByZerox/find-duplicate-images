import { DuplicateFileFinder } from './models/duplicate-file-finder';
import { ResultHandler } from './models/result-handler';
import { defaultConfig } from './default-config';

export interface IFileInfo {
  name: string;
  path: string;
}

(async () => {
  try {
    const results = await new DuplicateFileFinder({ pathToCheck: defaultConfig.pathToCheck }).find();
    await new ResultHandler({
      htmlFileName: defaultConfig.htmlFileName,
      jsFileName: defaultConfig.jsFileName,
      outputDir: defaultConfig.outputDir,
    }).ouputResults(results);
  } catch (error) {
    console.log('could not resolve duplicate files');
    console.log(error);
  }
})();