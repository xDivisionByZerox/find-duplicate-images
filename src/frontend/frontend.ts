import { FindResult } from '../shared/find-result';
import { createNoResultComponent } from './components/no-result.component';
import { createResultContainerComponent } from './components/result-container.component';
import { createSpinnerComponent } from './components/spinner.component';
import { requestService } from './util/request';

const pathInput = document.getElementById('path-input');
const recursiveInput = document.getElementById('recursive-input');
const resultContainerElement = getElementById('result-container');
const spinner = createSpinnerComponent();

function getElementById(id: string) {
  const elem = document.getElementById(id);
  if (!elem) {
    throw new Error('no resultContainerElement');
  }

  return elem;
}

function getRecursiveValue(): boolean {
  if (!(recursiveInput instanceof HTMLInputElement)) {
    throw new Error('Could not find recursiveInputElement');
  }
  const recursive = recursiveInput.checked;

  return recursive;
}

function getPathValue(): string {
  if (!(pathInput instanceof HTMLInputElement)) {
    throw new Error('Could not find pathInputElement');
  }
  const path = pathInput.value;

  return path;
}

async function submitConfiguration(): Promise<void> {
  const body = {
    recursive: getRecursiveValue(),
    path: getPathValue(),
  };
  getElementById('configuration-container').remove();

  resultContainerElement.appendChild(spinner);

  const response = await requestService.startFileDuplicationSearch(body);
  const { id } = response.data;

  await pollForResult(id).catch((error) => {
    console.log('Error during response polling:');
    console.log(error);
  });
}

async function pollForResult(id: string) {
  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      const response = await requestService.getProcesState(id);
      const result = response.data;
      if (isProcessingResponse(result)) {
        return pollForResult(id);
      }

      spinner.remove();

      if (isErrorResponse(result)) {
        throw new Error(result.error);
      }

      const component = getResultComponent(result);
      resultContainerElement.appendChild(component);

      return resolve();
    }, 5000);
  });
}

function getResultComponent(result: FindResult) {
  if (result.duplicates.length > 0) {
    return createResultContainerComponent(result.duplicates);
  } else {
    return createNoResultComponent();
  }
}

function isProcessingResponse(value: unknown): value is { text: string } {
  return (
    typeof value === 'object'
    && value !== null
    && 'text' in value
  );
}

function isErrorResponse(value: unknown): value is { error: string } {
  return (
    typeof value === 'object'
    && value !== null
    && 'error' in value
  );
}

getElementById('submit-configuration').onclick = submitConfiguration;
