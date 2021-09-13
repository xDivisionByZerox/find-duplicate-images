import { ArgumentParser } from './models/argument-parser';
import { readFile, unlink } from 'fs/promises'

(async () => {
  try {
    const config = ArgumentParser.parseDeleteArguments();
    const buffer = await readFile(config.path);
    const data = JSON.parse(buffer.toString('utf-8'));
    if(!(Array.isArray(data) && data.every((d) => typeof d === 'string'))) {
      throw new Error('malformed delete list');
    }

    const promises = data.map((d) => unlink(d));
    const result = await Promise.allSettled(promises);
    const deletedArr = result.filter((res) => res.status === 'fulfilled');
    console.log('Deleted', deletedArr.length, 'files');
  } catch (error) {
    console.log('could not delete files');
    console.log(error);
  }
})();