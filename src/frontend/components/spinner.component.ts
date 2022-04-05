export function createSpinnerComponent(): HTMLDivElement {
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');

  return spinner;
}
