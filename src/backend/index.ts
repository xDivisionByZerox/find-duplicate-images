import cors from 'cors';
import express, { json, urlencoded } from 'express';
import { statSync, unlinkSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { Server } from 'socket.io';
import { environment } from '../shared/environment';
import { ECompareProgressEventType } from '../shared/events/compare.events';
import { getEventName } from '../shared/events/names.events';
import { EReadProgressEventType } from '../shared/events/read.events';
import { DuplicationFinder } from './models/duplication-finder';
import { FileFinder } from './models/file-finder';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
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

  const id = Date.now().toString();
  io.of(environment.getSocketEnpoint(id)).on('connection', async (socket) => {
    const fileReader = new FileFinder({
      directoyPath: path,
      recursive,
      updateInterval: 1,
    });
    const buildReadEventEmitter = (type: EReadProgressEventType) => <T>(params: T) => socket.emit(getEventName('read', type), params);
    fileReader.events.found$.subscribe(buildReadEventEmitter(EReadProgressEventType.FOUND));
    fileReader.events.start$.subscribe(buildReadEventEmitter(EReadProgressEventType.START));
    fileReader.events.finish$.subscribe(buildReadEventEmitter(EReadProgressEventType.FINISH));
    const files = await fileReader.find();

    const buildCompareEventEmitter = (type: ECompareProgressEventType) => <T>(params: T) => socket.emit(getEventName('compare', type), params);
    const finder = new DuplicationFinder({ updateInterval: 1 });
    finder.events.finish$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.FINISH));
    finder.events.found$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.FOUND));
    finder.events.start$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.START));
    finder.events.update$.subscribe(buildCompareEventEmitter(ECompareProgressEventType.UPDATE));

    finder.find(files);
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

server.listen(environment.backendPort, () => {
  console.log('listening on', `${environment.backendUrl}`);
});
