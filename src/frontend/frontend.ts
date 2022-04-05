import { io, Socket } from 'socket.io-client';
import { environment } from '../shared/environment';
import { CompareFinishEvent, CompareFoundEvent, CompareUpdateEvent, ECompareProgressEventType } from '../shared/events/compare.events';
import { getEventName } from '../shared/events/names.events';
import { EReadProgressEventType, ReadFinishEvent } from '../shared/events/read.events';
import { createResultGroupComponent } from './components/result-group.component';
import { createSpinnerComponent } from './components/spinner.component';
import { postRequest } from './util/request';

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

  const { id } = await postRequest(environment.backendUrl, { recursive, path });
  if (typeof id !== 'string') {
    throw new Error('got no id from backend');
  }

  initializeResultListener(id);
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

  const socket: Socket = io(`${environment.backendUrl}${environment.getSocketEnpoint(id)}`);

  (() => {
    // setupReadListener
    const readResultContainerElement = document.createElement('div');
    readResultContainerElement.id = 'read-result-container';

    const readResultTextElement = document.createElement('div');
    const spinner = createSpinnerComponent();
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
    const spinner = createSpinnerComponent();

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

    const resultGroupComponent = createResultGroupComponent(resultNumber, group);
    resultContainer.appendChild(resultGroupComponent);
  }
}
