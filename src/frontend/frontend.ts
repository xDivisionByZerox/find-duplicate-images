import io from 'socket.io-client';
import config from '../shared/config';
import { DuplicationProgressFinishedEvent, DuplicationProgressFoundEvent, DuplicationProgressStartEvent, DuplicationProgressUpdateEvent, EDuplicationProgressEventType } from '../shared/events';

const configSubmitButton = document.getElementById('submit-configuration');
if(!(configSubmitButton instanceof HTMLButtonElement)) {
  throw new Error('could not find configuration submit button element');
}

configSubmitButton.onclick = submitConfiguration;

async function submitConfiguration() {
  const pathInput = document.getElementById('path-input');
  if (!(pathInput instanceof HTMLInputElement)) {
    return;
  }
  const path = pathInput.value;

  const recursiveInput = document.getElementById('path-input');
  if (!(recursiveInput instanceof HTMLInputElement)) {
    return;
  }
  const recursive = recursiveInput.checked;

  console.log({ path, recursive });

  const url = `${config.backendDomain}:${config.backendPort}`;
  const response = await fetch(url, {
    body: JSON.stringify({ recursive, path }),
    method: 'POST'
  });
  const json = response.json();
  console.log(json);
}

export function initializeResultListener(id: string) {
  let totalResultNumber = 0;
  const socket = io(`${config.backendDomain}:${config.backendPort}${config.getSocketEnpoint(id)}`, { query: { id } });
  socket.on(EDuplicationProgressEventType.FOUND.toString(), (ev: DuplicationProgressFoundEvent) => {
    console.log('got data', ev);
    const group = ev.group;
    if (group.length > 1) {
      totalResultNumber++;
      createGroupContainer(totalResultNumber, group);
    }
  });

  socket.on(EDuplicationProgressEventType.START.toString(), (ev: DuplicationProgressStartEvent) => {
    console.log('started', ev.step)
  });

  socket.on(EDuplicationProgressEventType.UPDATE.toString(), (ev: DuplicationProgressUpdateEvent) => {
    console.log('got update', ev);
  });

  socket.on(EDuplicationProgressEventType.FINISHED.toString(), (ev: DuplicationProgressFinishedEvent) => {
    console.log('got finish', ev);
  });

  const resultContainer = document.getElementById('result-container');

  function createGroupContainer(resultNumber: number, group: string[]) {
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