import { io, Socket } from 'socket.io-client';
import config from '../shared/config';
import { DuplicationProgressFinishedEvent, DuplicationProgressFoundEvent, DuplicationProgressStartEvent, DuplicationProgressUpdateEvent, EDuplicationProgressEventType } from '../shared/events';

const configSubmitButton = document.getElementById('submit-configuration');
if (!(configSubmitButton instanceof HTMLButtonElement)) {
  throw new Error('could not find configuration submit button element');
}

configSubmitButton.onclick = submitConfiguration;
const serverUrl = `${config.backendDomain}:${config.backendPort}`;

async function submitConfiguration(): Promise<void> {
  const pathInput = document.getElementById('path-input');
  if (!(pathInput instanceof HTMLInputElement)) {
    return;
  }
  const path = pathInput.value;

  const recursiveInput = document.getElementById('recursive-input');
  if (!(recursiveInput instanceof HTMLInputElement)) {
    return;
  }
  const recursive = recursiveInput.checked;

  const { id } = await postRequest(serverUrl, { recursive, path });
  if (typeof id !== 'string') {
    throw new Error('got no id from backend');
  }

  initializeResultListener(id)
}

async function postRequest(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return fetch(url, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  }).then((response) => response.json());
}

function initializeResultListener(id: string): void {
  const configContainer = document.getElementById('configuration-container');
  if (configContainer) {
    configContainer.style.display = 'none';
  }

  const readCountContainerElement = document.getElementById('read-count-container');
  if (!readCountContainerElement) {
    throw new Error('no read count container element');
  }

  let totalResultNumber = 0;
  const socket: Socket = io(`${config.backendDomain}:${config.backendPort}${config.getSocketEnpoint(id)}`);
  socket.on(EDuplicationProgressEventType.FOUND.toString(), (ev: DuplicationProgressFoundEvent) => {
    const { group } = ev;
    if (group.length > 1) {
      totalResultNumber++;
      createGroupContainer(totalResultNumber, group);
    }
  });

  socket.on(EDuplicationProgressEventType.START.toString(), (ev: DuplicationProgressStartEvent) => {
    const stepText = ev.step === 'compare' ? 'comparing' : 'reading'
    readCountContainerElement.innerText = `Stared ${stepText} files.`;
    readCountContainerElement.style.display = 'block';
  });

  socket.on(EDuplicationProgressEventType.UPDATE.toString(), (ev: DuplicationProgressUpdateEvent) => {
    const { completed, total } = ev;
    readCountContainerElement.innerText = `Read ${completed} / ${total} files.`;
  });

  socket.on(EDuplicationProgressEventType.FINISHED.toString(), (ev: DuplicationProgressFinishedEvent) => {
    const { completed, total, timeTaken } = ev;
    readCountContainerElement.innerText = `Read ${completed} / ${total} files in ${timeTaken}ms.`;
    socket.close();
  });

  function createGroupContainer(resultNumber: number, group: string[]) {
    const resultContainer = document.getElementById('result-container');
    if (!resultContainer) {
      throw new Error('can not find result container');
    }

    const groupContainer = document.createElement('section');
    groupContainer.classList.add('group-container');

    const groupHeaderRow = document.createElement('h3');
    groupHeaderRow.classList.add('row');
    groupHeaderRow.innerText = `Group ${resultNumber}`;
    groupContainer.appendChild(groupHeaderRow);

    for (const path of group) {
      const row = document.createElement('section');
      row.classList.add('row')

      row.appendChild(createNameColumn(path));
      row.appendChild(createImageColumn(path));
      row.appendChild(createDeleteButtonColumn(path));

      groupContainer.appendChild(row);
    }

    resultContainer.appendChild(groupContainer);
  }

  function createNameColumn(path: string) {
    const tableColName = document.createElement('section');
    tableColName.classList.add('col');
    tableColName.innerText = path.replace(/\\/g, '/').split('/').pop() ?? '';

    return tableColName;
  }

  function createImageColumn(path: string) {
    const column = document.createElement('section');
    column.classList.add('col');

    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    const imageElement = document.createElement('img');
    imageElement.src = path;
    imageElement.alt = `Preview of photo with path ${path}`;

    anchor.appendChild(imageElement);
    column.appendChild(anchor);

    return column;
  }

  function createDeleteButtonColumn(path: string) {
    const column = document.createElement('section');
    column.classList.add('col');
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'delete';
    deleteButton.onclick = async () => {
      const wantDelete = confirm(`Deleting this image will be permanent and can not be undone. Are you sure you really want to delete ${path}`);
      if(!wantDelete) {
        return;    
      }

      await postRequest(`${serverUrl}/delete`, { path });    

      const row = column.parentElement;
      if(!row) {
        return;
      }

      const group = row.parentElement;
      if(!group) {
        return;
      }

      row.remove();
      const remainingElements = Array.from(group.children).filter((elem) => elem instanceof HTMLDivElement);
      if(remainingElements.length <= 1) {
        group.remove();
      }
    };
    column.appendChild(deleteButton);

    return column;
  }
}
