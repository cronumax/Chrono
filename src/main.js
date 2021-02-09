const {
  app,
  BrowserWindow,
  ipcMain,
  net
} = require('electron')
const webdriver = require('selenium-webdriver')
const url = require('url')
const path = require('path')
const http = require('./http/http.js')
let win

app.on('ready', async () => {
  ipcMain.on('custom-message', (event, message) => {
    console.log(message.data);
    record()
  })

  ipcMain.on('login-message', (event, message) => {
    console.log(message.data);
    http.GET()
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
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  win.loadFile('public/html/login.html')
  win.maximize()
  // win.webContents.openDevTools()

  win.on('close', () => {
    win = null
  })

}

async function record() {
  let driver = await new webdriver.Builder().forBrowser('chrome').build()

  driver.get('https://google.com')
  driver.manage().window().maximize()
  driver.findElement(webdriver.By.name('q')).sendKeys('webdriver', webdriver.Key.RETURN)
}

async function finish() {}

async function play() {}
