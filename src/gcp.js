const puppeteer = require('puppeteer');
const config = {
    "email": "your.email@mail.mcgill.ca",
    "password": "pwd",
    "semester": "202005",
    "CRN": ["329", "327", "527", "528"]
}


exports.handler = async (req, res) => {

    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true
    });
    let page = await browser.newPage();
    await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin', {waitUntil: 'networkidle0'});

    //logs in
    await page.type('#mcg_un', config.email, {delay: 30});
    await page.type('#mcg_pw', config.password, {delay: 30});
    await page.click('#mcg_un_submit');
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    console.log("Login Successful");
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
    console.log("Term " + config.semester + " found, Starting to input CRNs");
    //inputs all the crn and submits them
    for (let i = 0; i < config.CRN.length; i++) {
        let inputID = "#crn_id" + (i + 1);
        let crn = config.CRN[i];
        await page.type(inputID, crn, {delay: 30})
    }
    await page.waitForXPath("/html/body/div[3]/form/input[19]", {waitUntil: 'networkidle0'}).then(selector => selector.click());

    try {
        await page.waitForSelector('.errortext', {timeout: 5000});

        const selector = 'body > div.pagebodydiv > form > table:nth-child(23)';
        const table = await page.$$eval(selector, trs => trs.map(tr => {
            const tds = [...tr.getElementsByTagName('td')];
            return tds.map(td => td.textContent);
        }));

        let classesList = table[0];
        let numbClass = classesList.length / 10;
        console.log("Registration failed " + numbClass + " class(es) failed");
        for (let i = 0; i < numbClass; i++) {
            let classCrn = classesList[1 + i * 10];
            let classSubj = classesList[2 + i * 10];
            let classCode = classesList[3 + i * 10];
            console.log("Failed to register to: CNR" + classCrn, classSubj + classCode);
        }
    } catch (error) {
        // although this is inside a catch block, this is the case where registration was successful.
        console.log("Success! All classes were registered.");
    }
    res.end();
};
