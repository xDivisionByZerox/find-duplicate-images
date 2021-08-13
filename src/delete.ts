import { ArgumentParser } from './models/argument-parser';
import { readFile, unlink } from 'fs/promises'

export interface IFileInfo {
  name: string;
  path: string;
}

(async () => {
  try {
    const config = ArgumentParser.parseDeleteArguments();
    const buffer = await readFile(config.path);
    const data = JSON.parse(buffer.toString('utf-8'));
    if(!(Array.isArray(data) && data.every((d) => typeof d === 'string'))) {
      throw new Error('malformed delete list');
    }

    const promises = data.map((d) => unlink(d));
    await Promise.all(promises);
    console.log('Deleted', data.length, 'files');
  } catch (error) {
    console.log('could not delete files');
    console.log(error);
  }
})();