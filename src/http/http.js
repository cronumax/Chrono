const {
  app,
  BrowserWindow,
  ipcMain,
  net
} = require('electron')


const hostname = '127.0.0.1',
  protocol = 'http:',
  port = 3000

let csrfToken = ''

function GET(url, win) {
  const request = net.request({
    method: 'GET',
    protocol: protocol,
    hostname: hostname,
    port: port,
    path: url,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  request.on('response', (response) => {
    // console.log(`STATUS: ${response.statusCode}`)
    // console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
    response.on('data', (chunk) => {
      let status = `${response.statusCode}`
      if (status == 200) {
        try {
          const obj = JSON.parse(`${chunk}`)
          console.log(obj.csrfToken)
          win.webContents.executeJavaScript("document.getElementById('signup-form')._csrf.value ='" + obj.csrfToken + "'")
        } catch (e) {

        }
      }
    })

    response.on('end', () => {
      //console.log('No more data in response.')
    })
  })
  request.end()
}

function POST(url, body, win) {
  csrfToken = (body._csrf.length <= 0) ? csrfToken : body._csrf
  console.log(csrfToken)
  const request = net.request({
    method: 'POST',
    protocol: protocol,
    hostname: hostname,
    port: port,
    path: url,
    headers: {
      'Content-Type': 'application/json',
      'csrf-token': csrfToken
    }
  })
  request.on('response', (response) => {

    response.on('data', (chunk) => {
      let status = `${response.statusCode}`
      let res = "BODY:" + `${chunk}`
      if (status == 200) {
        console.log(res)
        win.loadFile('public/html/index.html')
      }
    })

  })
  request.write(JSON.stringify(body))
  request.end()
}

function LogoutGET(url, win) {
  const request = net.request({
    method: 'GET',
    protocol: protocol,
    hostname: hostname,
    port: port,
    path: url,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  request.on('response', (response) => {
    // console.log(`STATUS: ${response.statusCode}`)
    // console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
    response.on('data', (chunk) => {
      let status = `${response.statusCode}`
      if (status == 200) {
        win.loadFile('public/html/login.html')
      }
    })
    response.on('end', () => {
      //console.log('No more data in response.')
    })
  })
  request.end()
}



module.exports = {
  GET: GET,
  POST: POST,
  LOGOUT: LogoutGET
};