import { environment } from '../shared/environment';
import { FindResult } from '../shared/find-result';
import { createNoResultComponent } from './components/no-result.component';
import { createResultContainerComponent } from './components/result-container.component';
import { createSpinnerComponent } from './components/spinner.component';
import { getRequest, postRequest } from './util/request';

function getElementById(id: string) {
  const elem = document.getElementById(id);
  if (!elem) {
    throw new Error('no resultContainerElement');
  }

  return elem;
}

function getRecursiveValue(): boolean {
  const recursiveInput = document.getElementById('recursive-input');
  if (!(recursiveInput instanceof HTMLInputElement)) {
    throw new Error('Could not find recursiveInputElement');
  }
  const recursive = recursiveInput.checked;

  return recursive;
}

function getPathValue(): string {
  const pathInput = document.getElementById('path-input');
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

  const resultContainerElement = getElementById('result-container');

  const spinner = createSpinnerComponent();
  resultContainerElement.appendChild(spinner);

  const { id } = await postRequest<{ id: string }>(environment.backendUrl, body);

  pollForResult();

  function pollForResult() {
    setTimeout(async () => {
      const result = await getRequest<FindResult | { error: string } | { text: string }>(`${environment.backendUrl}/status/${id}`);
      if (isProcessingRsponse(result)) {
        return pollForResult();
      }

      spinner.remove();

      if (isErrorResponse(result)) {
        throw new Error(result.error);
      } else {
        return handleResult(result);
      }
    }, 5000);
  }

  function handleResult(result: FindResult) {
    if (result.duplicates.length > 0) {
      resultContainerElement.appendChild(createResultContainerComponent(result.duplicates));
    } else {
      resultContainerElement.appendChild(createNoResultComponent());
    }
  }
}

function isProcessingRsponse(value: unknown): value is { text: string } {
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
