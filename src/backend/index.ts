import express, { json, urlencoded } from 'express';
import { statSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { Server } from 'socket.io';
import { v4 } from 'uuid';
import { DuplicationFinder } from './models/duplication-finder';
import config from '../shared/config';
import { EDuplicationProgressEventType } from '../shared/events';

interface IWorkingInstance {
  path: string;
  recursive: boolean;
}

const app = express();
const server = createServer(app);
const io = new Server(server);
const workMap: Record<string, IWorkingInstance> = {};

app.use(...[
  json(),
  urlencoded({
    extended: true,
  }),
]);

app
  .route('/')
  .post((request, response) => {
    const path = request.body.path;
    let recursive = request.body.recursive;
    if (!(statSync(path).isDirectory() && isAbsolute(path))) {
      response.send('Path must be a absolute directoy');

      return;
    }

    if (recursive === undefined) {
      recursive = false;
    }

    const workingId = v4();
    workMap[workingId] = { path, recursive };
    response.redirect(`/results/${workingId}`);
  });

app.get('/results/:itemId', async (request, response) => {
  const id = request.params.itemId;
  const item = workMap[id];
  if (item === undefined) {
    throw new Error('invalid work item');
  }

  io.of(config.getSocketEnpoint(id)).on('connection', async (socket) => {
    const finder = new DuplicationFinder({
      pathToCheck: item.path,
      recursive: item.recursive,
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

    delete workMap[id];
  });
});

server.listen(config.backendPort, () => {
  console.log('listening on', config.backendDomain, ':', config.backendPort);
});