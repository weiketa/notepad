// Modules to control application life and create native browser window
const {app, BrowserWindow ,Menu, MenuItem, dialog,ipcMain} = require('electron')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const menuTemplate = [
  {
      label: 'File',
      submenu: []
  },
  {
      label: 'Edit',
      submenu: [
          {
              role: 'undo'
          },
          {
              role: 'redo'
          },
          {
              type: 'separator'
          },
          {
              role: 'cut'
          },
          {
              role: 'copy'
          },
          {
              role: 'paste'
          },
          {
              role: 'pasteandmatchstyle'
          },
          {
              role: 'delete'
          },
          {
              role: 'selectall'
          }
      ]
  },
  {
      label: 'View',
      submenu: [
          {
              role: 'reload'
          },
          {
              role: 'forcereload'
          },
          {
              role: 'toggledevtools'
          },
          {
              type: 'separator'
          },
          {
              role: 'resetzoom'
          },
          {
              role: 'zoomin'
          },
          {
              role: 'zoomout'
          },
          {
              type: 'separator'
          },
          {
              role: 'togglefullscreen'
          }
      ]
  },
  {
      role: 'help',
      submenu: [
          {
              label: 'Home Page',
              click() { require('electron').shell.openExternal('http://www.baidu.com'); }
          }
      ]
  }
];

let safeExit = false;
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  const menu = Menu.buildFromTemplate(menuTemplate);

  menu.items[0].submenu.append(new MenuItem({
    label:'New',
    click(){
      mainWindow.webContents.send('action','new');
    },
    accelerator:'CmdOrCtrl+N'
  }))

  menu.items[0].submenu.append(new MenuItem({
    label: "Open",
    click(){
      mainWindow.webContents.send('action', 'open');
    },
    accelerator: 'CmdOrCtrl+O'
  }));

  menu.items[0].submenu.append(new MenuItem({
    label: "Save",
    click(){
      mainWindow.webContents.send('action', 'save');
    },
    accelerator: 'CmdOrCtrl+S'
  }));

  menu.items[0].submenu.append(new MenuItem({
    type: 'separator'
  }));

  menu.items[0].submenu.append(new MenuItem({
    role: 'quit'
  }));

  Menu.setApplicationMenu(menu);
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('close', (e) => {
    if(!safeExit){
      e.preventDefault();
      mainWindow.webContents.send('action', 'exiting');
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('reqaction',(event,arg)=>{
  switch(arg){
    case "exit":
    safeExit = true;
    app.quit();
    break;
  }
});

const {updateApp,startUpdate,restartApp} = require('./update');

ipcMain.on('checkUpdate', (event,arg) => {
  switch(arg){
    case "check":
    updateApp(app.getVersion(),mainWindow,app);
    break;
    case "start":
    startUpdate();
    break;
    case "end":
    restartApp();
    break;
  }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/*
 版本比对
 更新描述 <-- 描述列表
 更新 <-- 文件列表
 */