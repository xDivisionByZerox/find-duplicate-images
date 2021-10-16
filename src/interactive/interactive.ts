import express, { json, urlencoded } from 'express';
import { statSync } from 'fs';
import { createServer } from 'http';
import { isAbsolute } from 'path';
import { Server, Socket } from 'socket.io';
import { v4 } from 'uuid';
import { DuplicateFileFinder } from '../models/duplicate-file-finder';

interface IWorkingInstance {
  path: string;
  recursive: boolean;
}

const app = express();
const server = createServer(app);
const io = new Server(server);
const workMap: Record<string, IWorkingInstance> = {};

function initializeWebsocketNamespace(id: string, onConnect: (socket: Socket) => Promise<void>): void {
  if (typeof id !== 'string') {
    throw new Error('invalid id');
  }

  const result = workMap[id];
  if (result === undefined) {
    throw new Error('id no longer valid');
  }

  io
    .of(`/${id}`)
    .on('connection', async (socket) => {

      await onConnect(socket);
    });
}

app.use(json());
app.use(urlencoded({
  extended: true,
}));
app.use('/scripts', express.static(__dirname + '/scripts'))

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/configuration.html');
});

app.post('/', (request, response) => {
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
  response.redirect(`/results?id=${workingId}`);
});

app.get('/results', async (request, response) => {
  const id = request.query.id;
  if (typeof id !== 'string') {
    response.send({ error: 'invalid route' });
    return;
  }

  const item = workMap[id];
  if (item === undefined) {
    throw new Error('invalid work item');
  }

  initializeWebsocketNamespace(id, async (socket) => {
    console.log(item);
    await new DuplicateFileFinder({
      pathToCheck: item.path,
      recursive: item.recursive,
      updateInterval: 1,
      updateCallback: (params) => {
        socket.emit('data', params);
      }
    }).find();

    delete workMap[id];
  });

  response.sendFile(__dirname + '/results/results.html');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});