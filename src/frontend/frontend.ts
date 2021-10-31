import { io, Socket } from 'socket.io-client';
import config from '../shared/config';
import { DuplicationProgressFinishedEvent, DuplicationProgressFoundEvent, DuplicationProgressStartEvent, DuplicationProgressUpdateEvent, EDuplicationProgressEventType } from '../shared/events';

const configSubmitButton = document.getElementById('submit-configuration');
if (!(configSubmitButton instanceof HTMLButtonElement)) {
  throw new Error('could not find configuration submit button element');
}

configSubmitButton.onclick = submitConfiguration;

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

  const url = `${config.backendDomain}:${config.backendPort}`;
  const response = await fetch(url, {
    body: JSON.stringify({ recursive, path }),
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  });
  const { id } = await response.json();
  if (typeof id !== 'string') {
    throw new Error('got no id from backend');
  }

  initializeResultListener(id)
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

    const groupContainer = document.createElement('div');
    groupContainer.classList.add('group-container');

    const groupHeaderRow = document.createElement('h3');
    groupHeaderRow.classList.add('row');
    groupHeaderRow.innerText = `Group ${resultNumber}`;
    groupContainer.appendChild(groupHeaderRow);

    for (const path of group) {
      const tableRow = document.createElement('div');
      tableRow.classList.add('row')

      tableRow.appendChild(createNameColumn(path));
      tableRow.appendChild(createPathColumn(path));
      tableRow.appendChild(createImageColumn(path));
      tableRow.appendChild(createSelectColumn());

      groupContainer.appendChild(tableRow);
    }

    resultContainer.appendChild(groupContainer);
  }

  function createNameColumn(path: string) {
    const tableColName = document.createElement('div');
    tableColName.classList.add('col');
    tableColName.innerText = path.replace(/\\/g, '/').split('/').pop() ?? '';

    return tableColName;
  }

  function createPathColumn(path: string) {
    const tableColPath = document.createElement('div');
    tableColPath.classList.add('col');
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.text = path;
    tableColPath.appendChild(anchor);

    return tableColPath;
  }

  function createImageColumn(path: string) {
    // todo 
    // this does not work on express server because we cant access local file directory
    // find a workaround, ex. transmit buffer with file path
    const column = document.createElement('div');
    column.classList.add('col');
    const imageElement = document.createElement('img');
    imageElement.src = path;
    imageElement.alt = 'Preview of photo with path ' + path;
    column.appendChild(imageElement);

    return column;
  }

  function createSelectColumn() {
    const column = document.createElement('div');
    column.classList.add('col');
    const inputElement = document.createElement('input');
    inputElement.type = 'checkbox';
    column.appendChild(inputElement);

    return column;
  }
}
