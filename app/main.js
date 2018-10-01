const electron = require('electron');
const {app, Menu, dialog, ipcMain} = electron;
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');

let mainWindow = null;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  // ブラウザ(Chromium)の起動, 初期画面のロード
  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

const template = [
  {
    label: 'ファイル',
    submenu: [
      {
        label: 'エクスポート',
        submenu: [
          {
            label: 'JSONファイル',
            click() {
              exportFile();
            }
          },
          {
            label: 'HTMLファイル',
            click() {
              // TODO
            }
          }
        ]
      },
      {
        label: 'インポート',
        submenu: [
          {
            label: 'JSONファイル',
            click() {
              importFile();
            }
          }
        ]
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
      {role: 'reload'},
      {role: 'forcereload'},
      {role: 'toggledevtools'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {role: 'togglefullscreen'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'close'}
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click() {
          require('electron').shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  });

  // Edit menu
  template[1].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  );

  // Window menu
  template[3].submenu = [
    {role: 'close'},
    {role: 'minimize'},
    {role: 'zoom'},
    {type: 'separator'},
    {role: 'front'}
  ]
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

function exportFile() {
  const options = {
    title: "エクスポートするファイル",
    filters: [
      {name: 'JSON', extensions: ['json']}
    ]
  };
  dialog.showSaveDialog(options, fileNames => {
    try {
      fs.accessSync(fileNames, fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      // ファイルが存在しない場合。特に何もしない。
    }

    mainWindow.webContents.send('exportJson', fileNames);
  });
}

ipcMain.on('exportJsonResponse', (event, message) => {
  fs.writeFileSync(message.fileName, message.data, 'utf-8');
  dialog.showMessageBox({
    type: 'info',
    title: 'エクスポート',
    message: 'ファイルのエクスポートが完了しました。'
  });
});

function importFile() {
  const options = {
    title: "インポートするファイル",
    filters: [
      {name: 'JSON', extensions: ['json']}
    ]
  };
  dialog.showOpenDialog(options, fileNames => {
    const jsonData = fs.readFileSync(fileNames[0], 'utf-8');
    mainWindow.webContents.send('importJson', jsonData);
  });
}

ipcMain.on('importJsonResponse', event => {
  dialog.showMessageBox({
    type: 'info',
    title: 'インポート',
    message: 'ファイルのインポートが完了しました。'
  });
});
