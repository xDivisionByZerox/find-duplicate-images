import { ArgumentParser } from './models/argument-parser';
import { DuplicateFileFinder } from './models/duplicate-file-finder';
import { ResultHandler } from './models/result-handler';

export interface IFileInfo {
  name: string;
  path: string;
}

(async () => {
  try {
    const config = ArgumentParser.parseFindArguments();
    const results = await new DuplicateFileFinder(config).find();
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