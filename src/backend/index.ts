import cors from 'cors';
import express, { json, urlencoded } from 'express';
import { statSync, unlinkSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { Server } from 'socket.io';
import { v4 } from 'uuid';
import config from '../shared/config';
import { DuplicationFinder } from './models/duplication-finder';
import { ECompareProgressEventType } from '../shared/events/compare.events';
import { getEventName } from '../shared/events/names.events';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(...[
  json(),
  urlencoded({ extended: true }),
  cors({ origin: '*' }),
]);

app.get('/', (_, response) => response.json({ message: 'hello from backend' }));
app.post('/', (request, response) => {
  const path = request.body.path ?? '';
  const recursive = request.body.recursive ?? false;
  if (!(statSync(path).isDirectory() && isAbsolute(path))) {
    response.send('Path must be a absolute directoy');

    return;
  }

  const id = v4();
  io.of(config.getSocketEnpoint(id)).on('connection', async (socket) => {
    const finder = new DuplicationFinder({
      pathToCheck: path,
      recursive: recursive,
      updateInterval: 1,
    });
    const { finish$, start$, update$, found$ } = finder.events;
    start$.subscribe((p) => socket.emit(getEventName('compare', ECompareProgressEventType.START), p));
    found$.subscribe((p) => socket.emit(getEventName('compare', ECompareProgressEventType.FOUND), p));
    update$.subscribe((p) => socket.emit(getEventName('compare', ECompareProgressEventType.UPDATE), p));
    finish$.subscribe((p) => socket.emit(getEventName('compare', ECompareProgressEventType.FINISH), p));

    await finder.find();
  });

  response.json({ id });
});

app.post('/delete', (request, response) => {
  const { path } = request.body;
  if (typeof path !== 'string' && !isAbsolute(path)) {
    throw new Error('invalid path argument');
  }

  unlinkSync(path);

  response.status(200).json({ message: 'success' });
});

server.listen(config.backendPort, () => {
  console.log('listening on', `${config.backendDomain}:${config.backendPort}`);
});