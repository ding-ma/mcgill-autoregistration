const puppeteer = require('puppeteer');
const config = require("../credentials");


(async ()=>{

    let browser = await puppeteer.launch({headless:false});
    let page = await  browser.newPage();

    await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin',{waitUntil:'networkidle0'});

    await page.type('#mcg_un', config.email,{delay:30});
    await page.type('#mcg_pw', config.password,{delay:30});

    await page.click('#mcg_un_submit');
    await page.waitForNavigation({waitUntil:'networkidle0'});

})();
