import express, { json, urlencoded } from 'express';
import { statSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { Server } from 'socket.io';
import { v4 } from 'uuid';
import { DuplicationFinder } from './models/duplication-finder';
import config from '../shared/config';
import { EDuplicationProgressEventType } from '../shared/events';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server,{
  cors: {
    origin: '*',
  }
});

app.use(...[
  json(),
  urlencoded({ extended: true }),
  cors({ origin: '*' }),
]);

app.get('/', (_, res) => res.json({ message: 'hello from backend' }));
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
    finder.start$.subscribe((params) => {
      socket.emit(EDuplicationProgressEventType.START.toString(), params);
    });
    finder.found$.subscribe((params) => {
      socket.emit(EDuplicationProgressEventType.FOUND.toString(), params);
    });
    finder.update$.subscribe((params) => {
      socket.emit(EDuplicationProgressEventType.UPDATE.toString(), params);
    });
    finder.finish$.subscribe((params) => {
      socket.emit(EDuplicationProgressEventType.FINISHED.toString(), params);
    });

    await finder.find();
  });

  response.json({ id });
});

server.listen(config.backendPort, () => {
  console.log('listening on', `${config.backendDomain}:${config.backendPort}`);
});