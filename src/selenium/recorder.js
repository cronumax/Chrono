const webdriver = require('selenium-webdriver')
async function record() {
  let driver = await new webdriver.Builder().forBrowser('chrome').build()

  driver.get('https://google.com')
  driver.manage().window().maximize()
  driver.findElement(webdriver.By.name('q')).sendKeys('webdriver', webdriver.Key.RETURN)
}

async function finish() {}

async function play() {}


module.exports = {
  record: record,
  finish: finish,
  play: play
};