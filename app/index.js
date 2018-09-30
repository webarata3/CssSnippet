'use strict';

const newButton = document.getElementById('newButton');
const deleteButton = document.getElementById('deleteButton');

const snippetNameEl = document.getElementById('snippetName');
const htmlEl = document.getElementById('html');
const cssEl = document.getElementById('css');
const wvEl = document.getElementById('wv');

const listEl = document.querySelector('.list ul');

// 初期処理
disableForm();

let currentId = null;
const tempList = localStorage.getItem('idList');
let idList = tempList ? JSON.parse(tempList) : [];

idList.forEach(value => {
  const snippet = JSON.parse(localStorage.getItem(value));

  const li = document.createElement('li');
  li.textContent = snippet.name;
  li.id = value;
  listEl.appendChild(li);
});

newButton.addEventListener('click', event => {
  removeSelected();
  enableForm();

  currentId = localStorage.getItem('nextId') || 0;
  localStorage.setItem('nextId', parseInt(currentId, 10) + 1);

  idList.push(currentId);
  localStorage.setItem('idList', JSON.stringify(idList));

  htmlEl.value = '';
  cssEl.value = '';

  const li = document.createElement('li');
  li.textContent = '新規スニペット';
  li.id = currentId;
  listEl.appendChild(li);

  li.classList.add('selected');

  save();
});

deleteButton.addEventListener('click', event => {
  if (!currentId) return;

  if (confirm('このスニペットを消しますか？')) {
    disableForm();

    const el = document.getElementById(currentId);
    el.parentNode.removeChild(el);

    localStorage.removeItem(currentId);
    snippetNameEl.value = '';
    htmlEl.value = '';
    cssEl.value = '';

    wvEl.setAttribute('src', 'data:text/html,');

    idList.forEach((value, index) => {
      if (value === currentId) {
        idList.splice(index, 1);
        localStorage.setItem('idList', JSON.stringify(idList));
      }
    });
  }
});

snippetNameEl.addEventListener('input', event => {
  const el = document.getElementById(currentId);
  const text = event.currentTarget.value;

  el.textContent = text || '新規スニペット';

  changeSource();
});

htmlEl.addEventListener('input', event => {
  changeSource();
});

cssEl.addEventListener('input', event => {
  changeSource();
});

listEl.addEventListener('click', evnet => {
  const li = event.target;

  removeSelected();

  if (li.tagName === 'LI') {
    enableForm();

    li.classList.add('selected');

    const snippet = JSON.parse(localStorage.getItem(li.id));

    console.log(snippet.html);
    currentId = li.id;
    snippetNameEl.value = snippet.name;
    htmlEl.value = snippet.html;
    cssEl.value = snippet.css;

    changeSource();
  }
});

function removeSelected() {
  document.querySelectorAll('.list li').forEach(value => {
    value.classList.remove('selected');
  });
}

function enableForm() {
  deleteButton.disabled = false;
  snippetNameEl.disabled = false;
  htmlEl.disabled = false;
  cssEl.disabled = false;
}

function disableForm() {
  deleteButton.disabled = true;
  snippetNameEl.disabled = true;
  htmlEl.disabled = true;
  cssEl.disabled = true;
}

function changeSource() {
  const src = `data:text/html; charset=utf-8,${htmlEl.value}<style>${cssEl.value}</style>`;
  wvEl.setAttribute('src', src);
  save();
}

function save() {
  const saveData = {
    name: snippetNameEl.value || '新規スニペット',
    html: htmlEl.value,
    css: cssEl.value
  };
  localStorage.setItem(currentId, JSON.stringify(saveData));
}
