const id = getJsonFromUrl().id;
console.log(id);
const socket = io(`http://localhost:3000/${id}`, { query: 'id=' + id });
socket.on('data', (ev) => {
  console.log('got data', ev);
});

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