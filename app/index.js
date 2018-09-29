const htmlEl = document.getElementById('html');
const cssEl = document.getElementById('css');
const wvEl = document.getElementById('wv');

htmlEl.addEventListener('input', event => {
  changeSource();
});

cssEl.addEventListener('input', event => {
  changeSource();
});

function changeSource() {
  let s = `data:text/html; charset=utf-8,${htmlEl.value}<style>${cssEl.value}</style>`;
  wvEl.setAttribute('src', s);
}
