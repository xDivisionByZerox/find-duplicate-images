export function createSpinnerComponent(): HTMLDivElement {
  const spinner = document.createElement('div');

  const size = '2rem';
  spinner.style.width = size;
  spinner.style.height = size;

  spinner.style.borderRadius = '50%';
  spinner.style.borderStyle = 'solid';
  spinner.style.borderWidth = '0.25em';

  spinner.style.borderBottomColor = 'currentColor';
  spinner.style.borderLeftColor = 'currentColor';
  spinner.style.borderRightColor = 'transparent';
  spinner.style.borderTopColor = 'currentColor';

  let rotation = 0;
  const intervalTime = 800;
  const intervalSteps = 20;
  const step = 100 / intervalSteps;
  setInterval(() => {
    rotation = (rotation + step) % 360;
    spinner.style.transform = `rotate(${rotation}deg)`;
  }, intervalTime / intervalSteps);

  return spinner;
}
