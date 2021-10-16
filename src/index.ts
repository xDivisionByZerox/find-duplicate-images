import { ArgumentParser } from './models/argument-parser';
import { DuplicateFileFinder } from './models/duplicate-file-finder';
import { ResultHandler } from './models/result-handler';

(async () => {
  try {
    const config = ArgumentParser.parseFindArguments();
    const results = await new DuplicateFileFinder({
      pathToCheck: config.pathToCheck,
      recursive: config.recursive,
    }).find();
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