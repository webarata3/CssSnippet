'use strict';

const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('exportJson', async (event, fileName) => {
  const db = await DbUtil.init(db => {
    db.createObjectStore('snippet', {keyPath: 'id'});
  });
  const snippetList = await DbUtil.readAll(db, 'snippet');

  const resultList = [];
  snippetList.forEach(value => {
    delete value.id;
    resultList.push(JSON.stringify(value));
  });

  ipcRenderer.send('exportJsonResponse', {
    fileName: fileName,
    data: `[${resultList.join(',')}]`
  });
});

ipcRenderer.on('importJson', async (event, jsonData) => {
  const db = await DbUtil.init(db => {
    db.createObjectStore('snippet', {keyPath: 'id'});
  });

  const nextId = await DbUtil.readOne(db, 'next_id', 0);
  let currentId = nextId ? nextId.next_id : 0;

  const jsonObject = JSON.parse(jsonData);
  jsonObject.forEach(value => {
    value.id = currentId;
    DbUtil.put(db, 'snippet', value);
    currentId++;
  });
  await DbUtil.put(db, 'next_id', {id: 0, next_id: currentId});

  ipcRenderer.send('importJsonResponse');
});
