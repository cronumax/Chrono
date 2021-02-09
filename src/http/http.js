const {
  app,
  BrowserWindow,
  ipcMain,
  net
} = require('electron')


const hostname='127.0.0.1',
      protocol='http:',
      port= 3000


function GET(){
  const request = net.request({
      method: 'GET',
      protocol: protocol,
      hostname: hostname,
      port: port,
      path: "/user/signup",
      headers: {
        'Content-Type': 'application/json'
      }
     })
      request.on('response', (response) => {
      // console.log(`STATUS: ${response.statusCode}`)
      // console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
      response.on('data', (chunk) => {
      const obj =JSON.parse(`${chunk}`)

      console.log(obj.csrfToken)
      win.webContents.executeJavaScript("var test = document.getElementById('login-form'); test._csrf.value = obj.csrfToken " )

      })
      response.on('end', () => {
        //console.log('No more data in response.')
      })
    })
    request.end()
}

function POST(url, body){
    const request = net.request({
            method: 'POST',
            protocol: protocol,
            hostname: hostname,
            port: port,
            path: url,
            headers: {
              'Content-Type': 'application/json'
            }
           })
      request.on('response', (response) => {

      response.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`)
      })

    })
    request.write(JSON.stringify(body))
    request.end()
}


module.exports = {
    GET: GET,
    POST: POST,
};
