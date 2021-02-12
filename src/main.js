const {
  app,
  BrowserWindow,
  ipcMain,
  net
} = require('electron')
const url = require('url')
const path = require('path')
const http = require('./http/http.js')
const sel = require('./selenium/recorder.js')
let win

app.on('ready', async () => {
  ipcMain.on('custom-message', (event, message) => {
    console.log(message.data);
    sel.record()
  })

  ipcMain.on('login-message', (event, message) => {
    console.log(message.data);
    http.POST("user/signin", message.data, win)
  })

  ipcMain.on('signup-message', (event, message) => {
    console.log(message.data);
    http.POST("user/signup", message.data, win)
  })

  ipcMain.on('logout-message', (event, message) => {
    console.log(message.data);
    http.LOGOUT("user/logout", win)
  })
  ipcMain.on('switch-message', (event, message) => {
    // console.log(message.data);
     if(message.data =="signin")
     win.loadFile('public/html/login.html')
     else
      win.loadFile('public/html/signup.html')
  })

  createWindow()
})

// A listener that tries to quit the application when it no longer has any open windows. This listener is a no-op on macOS due to the operating system's window management behavior
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// A listener that creates a new browser window only if when the application has no visible windows after being activated. For example, after launching the application for the first time, or re-launching the already running application
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Define a function that creates a new browser window
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true
    }
  })

  win.loadFile('public/html/signup.html')
  win.maximize()
  // win.webContents.openDevTools()

  win.on('close', () => {
    win = null
  })

  http.GET("/user/signup", win)


}
