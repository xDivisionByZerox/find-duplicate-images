import { environment } from '../shared/environment';
import { FindResult } from '../shared/find-result';
import { createResultGroupComponent } from './components/result-group.component';
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

getElementById('submit-configuration').onclick = submitConfiguration;

async function submitConfiguration(): Promise<void> {
  const spinner = createSpinnerComponent();
  switchToResultView(spinner);

  const result = await postRequest<FindResult>(environment.backendUrl, {
    recursive: getRecursiveValue(),
    path: getPathValue(),
  });

  spinner.remove();

  appendResultGroups(result);
}

function switchToResultView(spinnerElement: HTMLElement) {
  getElementById('configuration-container').style.display = 'none';

  const resultContainerElement = getElementById('result-container');
  resultContainerElement.appendChild(spinnerElement);
}

function appendResultGroups(result: FindResult): void {
  const resultContainerElement = getElementById('result-container');

  const compareResultContainerElement = document.createElement('div');
  compareResultContainerElement.id = 'compare-result-container';
  resultContainerElement.appendChild(compareResultContainerElement);

  for (const [index, duplicates] of result.duplicates.entries()) {
    const resultGroupComponent = createResultGroupComponent(index + 1, duplicates);
    resultContainerElement.appendChild(resultGroupComponent);
  }
}
