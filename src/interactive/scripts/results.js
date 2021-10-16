const id = getJsonFromUrl().id;
const socket = io(`http://localhost:3000/${id}`, { query: 'id=' + id });
socket.on('data', (ev) => {
  console.log('got data', ev);
  const group = ev.lastDuplicationGroup;
  if(group.length > 1) { 
    createGroupContainer(group);
  }
});

const resultContainer = document.getElementById('result-container');
let totalResults = 0;

function createGroupContainer(group) {
  totalResults++;

  const groupContainer = document.createElement('div');
  groupContainer.classList.add('group-container');

  const groupHeaderRow = document.createElement('h3');
  groupHeaderRow.classList.add('row');
  groupHeaderRow.innerText = `Group ${totalResults}`;
  groupContainer.appendChild(groupHeaderRow);

  for (const path of group) {
    const tableRow = document.createElement('div');
    tableRow.classList.add('row')

    tableRow.appendChild(createNameColumn(path));
    tableRow.appendChild(createPathColumn(path));
    tableRow.appendChild(createImageColumn(path));
    tableRow.appendChild(createSelectColumn());

    groupContainer.appendChild(tableRow);
  }

  resultContainer.appendChild(groupContainer);
}

function createNameColumn(path) {
  const tableColName = document.createElement('div');
  tableColName.classList.add('col');
  tableColName.innerText = path.replaceAll('\\', '/').split('/').pop();

  return tableColName;
}

function createPathColumn(path) {
  const tableColPath = document.createElement('div');
  tableColPath.classList.add('col');
  const anchor = document.createElement('a');
  anchor.href = path;
  anchor.text = path;
  tableColPath.appendChild(anchor);

  return tableColPath;
}

function createImageColumn(path) {
  const column = document.createElement('div');
  column.classList.add('col');
  const imageElement = document.createElement('img');
  imageElement.src = path;
  imageElement.alt = 'Preview of photo with path ' + path;
  column.appendChild(imageElement);

  return column;
}

function createSelectColumn() {
  const column = document.createElement('div');
  column.classList.add('col');
  const inputElement = document.createElement('input');
  inputElement.type = 'checkbox';
  column.appendChild(inputElement);

  return column;
}

function generateDeleteFile() {
  const checked = [];
  const nodes = document.querySelectorAll('input[type=checkbox]');
  for (const node of nodes) {
    if (node.checked) {
      checked.push(node);
    }
  }

  const links = checked.map((i) => i.parentNode.parentNode.children[1].children[0].innerText);
  const anchor = document.createElement('a');
  const blob = new Blob([JSON.stringify(links)], {
    type: 'application/json',
  });
  anchor.href = URL.createObjectURL(blob);
  anchor.download = 'delete-duplicate-list.json';
  anchor.click();
}


function getJsonFromUrl(url) {
  if (!url) {
    url = location.search;
  }

  const query = url.substr(1);
  const result = {};
  query.split("&").forEach((part) => {
    const item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });

  return result;
}