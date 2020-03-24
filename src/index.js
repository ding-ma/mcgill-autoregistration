const puppeteer = require('puppeteer');
const config = require("../credentials");

(async () => {


    let browser = await puppeteer.launch({headless: false});
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
    await page.waitFor(500);

    //selects the term and navigates to next page
    await page.select('#term_id', config.semester);
    await page.waitForXPath("/html/body/div[3]/form/input", {waitUntil: 'networkidle0'}).then(selector => selector.click());
    await page.waitForNavigation();

    //inputs all the crn and submits them
    for (let i = 0; i < config.CRN.length; i++) {
        let inputID = "#crn_id" + (i + 1);
        let crn = config.CRN[i];
        await page.type(inputID, crn, {delay: 30})
    }
    await page.waitForXPath("/html/body/div[3]/form/input[19]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
})();
