import cors from 'cors';
import express, { json, urlencoded } from 'express';
import { statSync, unlinkSync } from 'fs';
import { isAbsolute } from 'path';
import { FindResult } from 'src/shared/find-result';
import { v4 } from 'uuid';
import { environment } from '../shared/environment';
import { findDuplicates } from './find-duplicates-async';

const app = express();

const resultMap = new Map<string, FindResult | null>();

app
  .use(
    cors({ origin: '*' }),
    json(),
    urlencoded({ extended: true }),
  )
  .post('/', async (req, res) => {
    const path = req.body.path ?? '';
    const recursive = req.body.recursive ?? false;
    if (!(isAbsolute(path) && statSync(path).isDirectory())) {
      res.send('Path must be a absolute directoy');
    } else {
      const resultId = v4();
      resultMap.set(resultId, null);
      res.json({
        id: resultId,
      });

      const result = await findDuplicates(path, recursive);
      resultMap.set(resultId, result);
    }
  })
  .get('/status/:id', (req, res) => {
    const id = req.params.id;
    const result = resultMap.get(id);
    const body = (() => {
      if (result === undefined) {
        return {
          error: 'invalid result id',
        };
      } else if (result === null) {
        return {
          text: 'still processing',
        };
      } else {
        return result;
      }
    })();

    res.json(body);
  })
  .delete('/file', (req, res) => {
    const { path } = req.query;
    if (typeof path !== 'string' || !isAbsolute(path)) {
      throw new Error('Invalid path argument');
    }

    unlinkSync(path);

    res.json({ message: 'success' });
  })
  .listen(environment.backendPort, () => {
    console.log('listening on', `${environment.backendUrl}`);
  });
