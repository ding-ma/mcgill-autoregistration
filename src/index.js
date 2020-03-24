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
    //selects the term
    //await page.select('select[name=term_in]', JSON.stringify(config.semester), {delay: 30});
    // await page.waitForXPath("/html/body/div[3]/form/table/tbody/tr[1]/td[2]/select/option[1]",{waitUntil: 'networkidle0'});

    //#term_id > option:nth-child(1)

    await page.waitForXPath("/html/body/div[3]/form/input", {waitUntil: 'networkidle0'}).then(selector => selector.click());

    await page.type('input[name=crn_id1]', config.CRNs[0], {delay: 30});
    // for (let i = 0; i <config.CRNs.length ; i++) {
    //     let inputID = "#crn_id"+(i+1);
    //     let crn = config.CRNs[i];
    //     await page.type(inputID,crn,{delay: 30});
    // }

})();
