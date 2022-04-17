export function createNoResultComponent() {
  const elem = document.createElement('div');
  elem.innerText = 'There are no duplicate files.';

  return elem;
}
