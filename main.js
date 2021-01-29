// Import app & BrowserWindow modules of electron package
const { app, BrowserWindow } = require('electron')

// Define a function that creates a new browser window
function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.loadFile('index.html')
}

// Create a new browser window by invoking the createWindow function once the Electron application is initialized
app.whenReady().then(createWindow)

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
