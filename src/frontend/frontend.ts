import { io, Socket } from 'socket.io-client';
import config from '../shared/config';
import { CompareFinishEvent, CompareFoundEvent, CompareUpdateEvent, ECompareProgressEventType } from '../shared/events/compare.events';
import { getEventName } from '../shared/events/names.events';
import { EReadProgressEventType, ReadFinishEvent } from '../shared/events/read.events';
import { createSpinner } from './components/spinner.component';

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

  initializeResultListener(id);
}

async function postRequest(url: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return fetch(url, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }).then(async (response) => response.json());
}

function initializeResultListener(id: string): void {
  const configContainer = document.getElementById('configuration-container');
  if (configContainer) {
    configContainer.style.display = 'none';
  }

  const resultContainerElement = document.getElementById('result-container');
  if (!resultContainerElement) {
    throw new Error('no resultContainerElement');
  }

  const socket: Socket = io(`${config.backendDomain}:${config.backendPort}${config.getSocketEnpoint(id)}`);

  (() => {
    // setupReadListener
    const readResultContainerElement = document.createElement('div');
    readResultContainerElement.id = 'read-result-container';

    const readResultTextElement = document.createElement('div');
    const spinner = createSpinner();
    readResultContainerElement.appendChild(readResultTextElement);

    resultContainerElement.appendChild(readResultContainerElement);

    socket.on(getEventName('read', EReadProgressEventType.START), () => {
      readResultTextElement.innerText = 'Stared reading files.';
      readResultContainerElement.appendChild(spinner);
    });

    socket.on(getEventName('read', EReadProgressEventType.FINISH), (ev: ReadFinishEvent) => {
      const {
        timeTaken,
        files,
        subDirectories,
        totalBytes,
      } = ev;

      readResultTextElement.innerText = [
        `Found ${files} files.`,
        `Found ${subDirectories} subdirectories.`,
        `Found total of ${totalBytes} bytes.`,
        `Took ${timeTaken}ms.`,
      ].join('\n');
      spinner.style.display = 'none';
    });
  })();

  (() => {
    // setupCompareListener
    const compareResultContainerElement = document.createElement('div');
    compareResultContainerElement.id = 'compare-result-container';
    resultContainerElement.appendChild(compareResultContainerElement);
    const spinner = createSpinner();

    let totalResultNumber = 0;

    socket.on(getEventName('compare', ECompareProgressEventType.START), () => {
      compareResultContainerElement.innerText = 'Stared comparing files.';
      compareResultContainerElement.appendChild(spinner);
    });

    socket.on(getEventName('compare', ECompareProgressEventType.FOUND), (ev: CompareFoundEvent) => {
      const { group } = ev;
      if (group.length > 1) {
        totalResultNumber++;
        createGroupContainer(totalResultNumber, group);
      }
    });

    const getUpdateText = (complete: number, total: number) => `Compared ${complete} / ${total} files.`;
    socket.on(getEventName('compare', ECompareProgressEventType.UPDATE), (ev: CompareUpdateEvent) => {
      const { completed, total } = ev;
      compareResultContainerElement.innerText = getUpdateText(completed, total);
    });

    socket.on(getEventName('compare', ECompareProgressEventType.FINISH), (ev: CompareFinishEvent) => {
      const { completed, total, timeTaken } = ev;
      compareResultContainerElement.innerText = `${getUpdateText(completed, total)} Took ${timeTaken}ms.`;
      spinner.style.display = 'none';
    });
  })();

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
      row.classList.add('row');

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
    tableColName.innerText = path
      .replace(/\\/g, '/')
      .split('/')
      .pop() ?? '';

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
      // eslint-disable-next-line no-alert
      const wantDelete = confirm(`Deleting this image will be permanent and can not be undone. Are you sure you really want to delete ${path}`);
      if (!wantDelete) {
        return;
      }

      await postRequest(`${serverUrl}/delete`, { path });

      const row = column.parentElement;
      if (!row) {
        return;
      }

      const group = row.parentElement;
      if (!group) {
        return;
      }

      row.remove();
      const remainingElements = Array.from(group.children).filter((elem) => elem instanceof HTMLDivElement);
      if (remainingElements.length <= 1) {
        group.remove();
      }
    };
    column.appendChild(deleteButton);

    return column;
  }
}
