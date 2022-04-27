import cors from 'cors';
import { v4 } from 'uuid';
import express, { json, urlencoded } from 'express';
import { statSync, unlinkSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { FindResult } from 'src/shared/find-result';
import { environment } from '../shared/environment';
import { findDuplicates } from './find-duplicates-async';

const app = express();
const server = createServer(app);

const resultMap = new Map<string, FindResult | null>();

app
  .use(
    json(),
    urlencoded({ extended: true }),
    cors({ origin: '*' }),
  )
  .post('/', async (req, res) => {
    const path = req.body.path ?? '';
    const recursive = req.body.recursive ?? false;
    if (!(statSync(path).isDirectory() && isAbsolute(path))) {
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
    if (result === undefined) {
      res.status(403).json({
        error: 'invalid result id',
      });
    } else if (result === null) {
      res.status(102).json({
        text: 'still processing',
      });
    } else {
      res.status(200).json(result);
    }
  })
  .delete('/file', (req, res) => {
    const { path } = req.query;
    if (typeof path !== 'string' || !isAbsolute(path)) {
      throw new Error('Invalid path argument');
    }

    unlinkSync(path);

    res.json({ message: 'success' });
  });

server.listen(environment.backendPort, () => {
  console.log('listening on', `${environment.backendUrl}`);
});
