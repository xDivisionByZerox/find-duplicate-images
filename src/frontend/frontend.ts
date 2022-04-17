import { environment } from '../shared/environment';
import { FindResult } from '../shared/find-result';
import { createResultContainerComponent } from './components/result-container.component';
import { createSpinnerComponent } from './components/spinner.component';
import { postRequest } from './util/request';

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

  const result = await postRequest<FindResult>(environment.backendUrl, body);
  spinner.remove();

  resultContainerElement.appendChild(createResultContainerComponent(result.duplicates));
}

getElementById('submit-configuration').onclick = submitConfiguration;
