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
import { FileFinder } from './models/file-finder';
import { EReadProgressEventType } from '../shared/events/read.events';

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
    const buildReadEventEmitter = (type: EReadProgressEventType) => {
      return <T>(params: T) => socket.emit(getEventName('read', type), params);
    };
    const fileReader = new FileFinder({
      directoyPath: path,
      recursive,
      updateInterval: 1,
    });
    fileReader.events.found$.subscribe(buildReadEventEmitter(EReadProgressEventType.FOUND));
    fileReader.events.start$.subscribe(buildReadEventEmitter(EReadProgressEventType.START));
    fileReader.events.finish$.subscribe(buildReadEventEmitter(EReadProgressEventType.FINISH));
    const files = await fileReader.read();

    const buildCompareEventEmitter = (type: ECompareProgressEventType) => {
      return <T>(params: T) => socket.emit(getEventName('compare', type), params);
    };
    const finder = new DuplicationFinder({ updateInterval: 1 });
    finder.events.finish$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.FINISH));
    finder.events.found$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.FOUND));
    finder.events.start$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.START));
    finder.events.update$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.UPDATE));

    await finder.find(files);
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