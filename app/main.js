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

  initMenu();
});

function initMenu() {
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
      label: '編集',
      submenu: [
        {
          label: '元に戻す',
          accelerator: 'Command+Z',
          role: 'undo'
        },
        {
          label: 'やり直し',
          accelerator: 'Command+Y',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: '切り取り',
          accelerator: 'Command+X',
          role: 'cut'
        },
        {
          label: 'コピー',
          accelerator: 'Command+C',
          role: 'copy'
        },
        {
          label: '貼り付け',
          accelerator: 'Command+V',
          role: 'paste'
        }
      ]
    },
    {
      label: '開発',
      submenu: [
        {
          label: '再読込',
          accelerator: 'Command+R',
          click: function() { mainWindow.reload(); }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: function() { mainWindow.toggleDevTools(); }
        },
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
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

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
  mainWindow.reload();
  dialog.showMessageBox({
    type: 'info',
    title: 'インポート',
    message: 'ファイルのインポートが完了しました。'
  });
});
