const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  //1. Visit to the Fortinet developer login page
  await page.goto('https://fndn.fortinet.net/index.php?/login/');
  await page.setViewport({width: 1080, height: 1024});
  await page.screenshot({path: 'screenshot/screenshot1.png'});

  //2. Type email
  await page.type('#auth', process.env.EMAIL);

  //3. Click the submit button
  const submitBtn = '#elSignIn_submit';
  await page.waitForSelector(submitBtn);
  await page.click(submitBtn);
  await page.screenshot({path: 'screenshot/screenshot2.png'});

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
  await page.screenshot({path: 'screenshot/screenshot3.png'});
  await page.goto('https://fndn.fortinet.net/index.php?/fortidemo/instances/&details=handsonlabs&_fromLogin=1');
  await page.screenshot({path: 'screenshot/screenshot4.png'});

  //7. Click the dropdown
  const dropdownBtn = '.icon_dropdown';
  await page.waitForSelector(dropdownBtn);
  await page.click(dropdownBtn);
  await page.screenshot({path: 'screenshot/screenshot5.png'});
  const sizeLinks = await page.$$('.fa-play-circle')
  await sizeLinks[0].click();
  await page.screenshot({path: 'screenshot/screenshot6.png'});

  //8. Click the first lab
  const extendBtn = '.fa-clock-o';
  await page.waitForSelector(extendBtn);
  await page.click(extendBtn);
  await page.screenshot({path: 'screenshot/screenshot7.png'});
  await browser.close();
})();