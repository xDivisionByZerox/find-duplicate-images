import cors from 'cors';
import express, { json, urlencoded } from 'express';
import { statSync, unlinkSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { environment } from '../shared/environment';
import { findDuplicates } from './find-duplicates-async';

const app = express();
const server = createServer(app);

app
  .use(
    json(),
    urlencoded({ extended: true }),
    cors({ origin: '*' }),
  )
  .post('/', async (request, response) => {
    const path = request.body.path ?? '';
    const recursive = request.body.recursive ?? false;
    if (!(statSync(path).isDirectory() && isAbsolute(path))) {
      response.send('Path must be a absolute directoy');
    } else {
      const result = await findDuplicates(path, recursive);

      response.json(result);
    }
  })
  .post('/delete', (request, response) => {
    const { path } = request.body;
    if (typeof path !== 'string' && !isAbsolute(path)) {
      throw new Error('Invalid path argument');
    }

    unlinkSync(path);

    response.json({ message: 'success' });
  });

server.listen(environment.backendPort, () => {
  console.log('listening on', `${environment.backendUrl}`);
});
