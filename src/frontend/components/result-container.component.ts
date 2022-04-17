import { createResultGroupComponent } from './result-group.component';

export function createResultContainerComponent(duplicates: string[][]) {
  const compareResultContainerElement = document.createElement('div');
  compareResultContainerElement.id = 'compare-result-container';

  for (const [index, group] of duplicates.entries()) {
    const resultGroupComponent = createResultGroupComponent(index + 1, group);
    compareResultContainerElement.appendChild(resultGroupComponent);
  }

  return compareResultContainerElement;
}
