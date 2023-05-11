const puppeteer = require('puppeteer');
const winston = require('winston');
const axios = require('axios');
const logHistory = [];

//const screenshotPrefix = 'screenshot/';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'log/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'log/combined.log' }),
  ],
});

const printLog = (level, msg, logHistory = null) => {
  console.log(msg);
  logger.log(level, msg);
  if (logHistory !== null) {
    logHistory.push(msg);
  }
}

const checkCredentials = () => {
  let requiredCredentials = [];
  if (!process.env.EMAIL) {
    requiredCredentials.push('EMAIL');
  }
  if (!process.env.USERNAME) {
    requiredCredentials.push('USERNAME');
  }
  if (!process.env.PASSWORD) {
    requiredCredentials.push('PASSWORD');
  }
  
  if (requiredCredentials.length > 0) {
    printLog('error', `Please set the following credentials as environment variables. ${requiredCredentials.join()}`, logHistory);
    process.exit(0); 
  }
}

(async () => {
  //0. Check credentials
  checkCredentials();

  let browser;
  try {
    browser = await puppeteer.launch({headless: 'new'});
  } catch (e) {
    console.info("Unable to launch browser mode in sandbox mode. Lauching Chrome without sandbox.");
    browser = await puppeteer.launch({ headless: 'new', args:['--no-sandbox']});
  }
  
  const page = await browser.newPage();
  //1. Visit to the Fortinet developer login page
  await page.goto('https://fndn.fortinet.net/index.php?/login/');
  await page.setViewport({width: 1080, height: 1024});
  
  //2. Type email
  await page.type('#auth', process.env.EMAIL);

  //3. Click the submit button
  const submitBtn = '#elSignIn_submit';
  await page.waitForSelector(submitBtn);
  await page.click(submitBtn);
  
  //4. Type username and password on the SSO page
  await page.waitForSelector('.logoWithPortalIcons');
  await page.type('#id_username', process.env.USERNAME);
  await page.type('#id_password', process.env.PASSWORD);

  //5. Click the submit button
  const submitBtn2 = '.submit';
  await page.waitForSelector(submitBtn2);
  await page.click(submitBtn2);

  //6. Visit to the lab page
  await page.waitForSelector('#elSiteTitle');
  await page.goto('https://fndn.fortinet.net/index.php?/fortidemo/instances/&details=handsonlabs&_fromLogin=1', { waitUntil: 'load', timeout: 0});
  
  //7. Click the dropdown
  const dropdownBtn = '.icon_dropdown';
  await page.waitForSelector(dropdownBtn);
  await page.click(dropdownBtn);
  let sizeLinks = await page.$$('.fa-play-circle')

  for (let i = 0 ; i < sizeLinks.length; i++) {
    await sizeLinks[i].evaluate(b => b.click()); 
    await page.waitForSelector('.vte-instance-header-title');
    let element = await page.$('.vte-instance-header-title');
    let value = await page.evaluate(el => el.textContent, element);
    value = value ? value.trim() : `${i + 1}`;
    
    //8. Click the extend button
    extendBtn = '.fa-clock-o';
    await page.waitForSelector('.vte-instance');
    let handle = await page.$(extendBtn);
    
    if (handle) {
      await handle.evaluate(b => b.click());  
      printLog('info', `${value} is extended successfully!`, logHistory);
      //await page.screenshot({path: `${screenshotPrefix}${value}-extend.png`});
    } else {
      //9. Close the dialog
      closeBtn = '.ipsDialog_close'
      handle = await page.$(closeBtn);
      if (handle) {
        await handle.evaluate(b => b.click());  
        printLog('info', `${value} has already been extended.`, logHistory);
        //await page.screenshot({path: `${screenshotPrefix}${value}-close.png`});
      }
    }
    
    //10. Click the dropdown
    await page.waitForSelector(dropdownBtn);
    handle = await page.$(dropdownBtn);
    if (handle) {
      await handle.evaluate(b => b.click());  
      //await page.screenshot({path: `${screenshotPrefix}${value}-dropdown-again.png`});
      sizeLinks = await page.$$('.fa-play-circle')
    }
  }

  await browser.close();

  console.log(logHistory.join('\n'))

  if (process.env.LINE_BOT_ID && process.env.LINE_ACCESS_TOKEN) {
    axios.post('https://api.line.me/v2/bot/message/push', {
      "to": process.env.LINE_BOT_ID,
      "messages":[
          {
              "type":"text",
              "text": logHistory.join('\n')
          }
      ]
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_ACCESS_TOKEN}` 
      }
    })
    .then(function (response) {
      printLog('info', response.status);
    })
    .catch(function (error) {
      printLog('error', error);
    });
  }
})();