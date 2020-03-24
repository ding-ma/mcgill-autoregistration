const puppeteer = require('puppeteer');
const config = require("../credentials");


(async ()=>{

    let browser = await puppeteer.launch({headless:false});
    let page = await browser.newPage();

    await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin', {waitUntil: 'networkidle0'});

    //logs in
    await page.type('#mcg_un', config.email, {delay: 30});
    await page.type('#mcg_pw', config.password, {delay: 30});
    await page.click('#mcg_un_submit');
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    //navigation to student
    await page.waitForXPath("/html/body/div[1]/div[2]/span/map/table/tbody/tr[1]/td/table/tbody/tr/td[5]", {waitUntil: 'networkidle0'}).then(selector => selector.click());

    //navigates to registration
    await page.waitForXPath("/html/body/div[3]/table[1]/tbody/tr[2]/td[2]/a", {waitUntil: 'networkidle0'}).then(selector => selector.click());

    //navigates to quick add drop
    await page.waitForXPath("/html/body/div[3]/table[1]/tbody/tr[3]/td[2]/a", {waitUntil: 'networkidle0'}).then(selector => selector.click());

    await page.waitFor(1000);
    //selects the term
    await page.hover('#term_id', config.semester, {delay: 30});
    await page.click("#submit");
})();
