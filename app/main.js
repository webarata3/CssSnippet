const electron = require('electron');
const {app, Menu, dialog, ipcMain, shell} = electron;
const path = require('path');
const BrowserWindow = electron.BrowserWindow;
const fs = require('fs');

let mainWindow = null;
const info_path = path.join(app.getPath("userData"), "bounds-info.json");

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  let bounds_info;
  try {
    bounds_info = JSON.parse(fs.readFileSync(info_path, 'utf-8'));
  }
  catch (e) {
    bounds_info = {width: 800, height: 600};  // デフォルトバリュー
  }

  // ブラウザ(Chromium)の起動, 初期画面のロード
  mainWindow = new BrowserWindow(bounds_info);
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.on('close', function() {
    fs.writeFileSync(info_path, JSON.stringify(mainWindow.getBounds()));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  initMenu();
});

function initMenu() {
  let     template = [
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
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'やり直し',
          accelerator: 'CmdOrCtrl+Y',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: '切り取り',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'コピー',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: '貼り付け',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        }
      ]
    },
    {
      label: '開発',
      submenu: [
        {
          label: '再読込',
          accelerator: 'CmdOrCtrl+R',
          click: function() {
            mainWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+CmdOrCtrl+I',
          click: function() {
            mainWindow.toggleDevTools();
          }
        },
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'クレジット',
          click: function() {
            shell.openExternal('https://www.yahoo.co.jp');
          }
        },
        {
          label: 'バージョン情報',
          click: function() {
            dialog.showMessageBox({
              type: 'none',
              title: 'バージョン情報',
              message:
                `${app.getName()} version ${app.getVersion()}
©2018 webarata3（Shinichi ARATA）`
            });
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
