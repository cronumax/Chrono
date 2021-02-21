const {
  ipcRenderer,
} = require('electron')

process.once('loaded', () => {
  window.addEventListener('message', event => {
    // do something with custom event
    const message = event.data

    if (message.myTypeField === 'my-custom-message') {
      ipcRenderer.send('custom-message', message)
    }

    if (message.myTypeField === 'login-message') {

      ipcRenderer.send('login-message', message)
    }

    if (message.myTypeField === 'signup-message') {

      ipcRenderer.send('signup-message', message)
    }

    if (message.myTypeField === 'logout-message') {

      ipcRenderer.send('logout-message', message)
    }

    if (message.myTypeField === 'switch-message') {

      ipcRenderer.send('switch-message', message)
    }

    if (message.myTypeField === 'resetPassword-message') {

      ipcRenderer.send('resetPassword-message', message)
    }

    if (message.myTypeField === 'resetForm-message') {

      ipcRenderer.send('resetForm-message', message)
    }
  })
})