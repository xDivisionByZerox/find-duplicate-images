import { serverUrl } from '../config/server-url.constant';
import { postRequest } from '../util/request';

export function createResultGroupComponent(resultNumber: number, group: string[]) {
  const elem = document.createElement('section');
  elem.classList.add('group-container');

  const groupHeaderRow = document.createElement('h3');
  groupHeaderRow.classList.add('row');
  groupHeaderRow.innerText = `Group ${resultNumber}`;
  elem.appendChild(groupHeaderRow);

  for (const path of group) {
    const row = document.createElement('section');
    row.classList.add('row');

    row.appendChild(createNameColumn(path));
    row.appendChild(createImageColumn(path));
    row.appendChild(createDeleteButtonColumn(path));

    elem.appendChild(row);
  }

  return elem;
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
