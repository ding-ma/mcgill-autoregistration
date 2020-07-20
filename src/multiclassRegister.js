const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');

/*
EDIT THE CONFIG BELOW BEFORE RUNNING

This function takes in class list even though there is a conflict in schedule

email: McGill Minerva username
password: McGill Minerva password
Term - Term you wish to register for, found in VSB URL (ex. term=202005)
CRN - List of CRNs you wish to register for, found in VSB at bottom of screen
url - Select the classes you want on VSB for your selected term then copy the URL over
wantEmail - Set to true if you want an email notification upon successful registration
notifEmail - Where to send notification email to, leave blank if wantEmail is false
sgApiKey - Received when registered for sendgrid, leave blank is wantEmail is false
*/

const config = {
    "regEmail": "firstname.lastname@mail.mcgill.ca",
    "password": "password",
    "term": "202009",
    "CRN": ["289"],
    "url": "VSB_URL",
    "wantEmail": true,
    "notifEmail": "",
    "sgApiKey": "SG.xxx..."
};

exports.multiclass = async (req, res) => {

    if (config.wantEmail) {
        sgMail.setApiKey(config.sgApiKey);
    }

    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true //set to false if you want to see browser
    });
    let page = await browser.newPage();

    await page.goto(config.url, {waitUntil: 'networkidle0'});

    let canProceed = false;
    //this grabs every div for the classes
    let i = 3;
    while (true) { //CHANGE this to the the number of classes you have
        let e = "/html/body/div[1]/div[2]/div[3]/div/table/tbody/tr/td[1]/div[3]/div[10]/div[" + i + "]/div[2]/div[5]/div";
        try {
            let [element] = await page.$x(e);
            let text = await page.evaluate(element => element.textContent, element);
            console.log(text, i - 2, text.includes("All classes are full"));
            if (!text.includes("All classes are full")) { //this checks that at least one of the classes has a free spot
                canProceed = true;
                break;
            }
        } catch (e) {
            break;
        }
        i++;
    }

    if (canProceed) {

        console.log("Preparing to register");

        await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin', {waitUntil: 'networkidle0'});

        //logs in
        await page.type('#mcg_un', config.regEmail, {delay: 30});
        await page.type('#mcg_pw', config.password, {delay: 30});
        await page.click('#mcg_un_submit');
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        console.log("Login Successful");
        //navigation to student
        await page.waitForXPath("/html/body/div[1]/div[2]/span/map/table/tbody/tr[1]/td/table/tbody/tr/td[5]", {waitUntil: 'networkidle0'}).then(selector => selector.click());

        //navigates to registration
        /*
        McGill COVID19 changed the xpath old one: /html/body/div[3]/table[1]/tbody/tr[2]/td[2]/a
         */
        await page.waitForXPath("/html/body/div[3]/table[1]/tbody/tr[3]/td[2]/a", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitForNavigation();

        //navigates to quick add drop
        await page.waitForXPath("/html/body/div[3]/table[1]/tbody/tr[3]/td[2]/a", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitFor(500);

        //selects the term and navigates to next page
        await page.select('#term_id', config.term);
        await page.waitForXPath("/html/body/div[3]/form/input", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitForNavigation();
        console.log("Term " + config.term + " found, Starting to input CRNs");
        //inputs all the crn and submits them
        for (let i = 0; i < config.CRN.length; i++) {
            let inputID = "#crn_id" + (i + 1);
            let crn = config.CRN[i];
            await page.type(inputID, crn, {delay: 30})
        }
        await page.waitForXPath("/html/body/div[3]/form/input[19]", {waitUntil: 'networkidle0'}).then(selector => selector.click());

        //checks if there are errors after registration
        let classesList;
        try {
            await page.waitForSelector('.errortext', {timeout: 5000});

            const selector = 'body > div.pagebodydiv > form > table:nth-child(23)';
            const table = await page.$$eval(selector, trs => trs.map(tr => {
                const tds = [...tr.getElementsByTagName('td')];
                return tds.map(td => td.textContent);
            }));

            classesList = table[0];
            let numbClass = classesList.length / 10;
            console.log("Registration failed for " + numbClass + " class(es)");
            for (let i = 0; i < numbClass; i++) {
                let failReason = classesList[i * 10];
                let classCrn = classesList[1 + i * 10];
                let classSubj = classesList[2 + i * 10];
                let classCode = classesList[3 + i * 10];
                let classType = classesList[5 + i * 10];
                console.log("Failed (" + failReason.substr(0, failReason.length - 1) + ") to register to: CNR" + classCrn, classSubj + classCode, classType);
            }
        } catch (error) {
            // although this is inside a catch block, this is the case where registration was successful.
            console.log("Success! All classes were registered.");
        }

        if (config.wantEmail) {

            let msg = {
                to: config.notifEmail,
                from: {
                    email: "minervaRegistration@mcgill.ca ",
                    name: "Minerva"
                },
                subject: "Successful Registration For Semester " + config.term,
                text: "At least one class was registered. Please check minerva @ www.mcgill.ca/minerva."
            };
            await sgMail.send(msg);
            console.log("Email Sent!");
        }

    } else {
        console.log("Class is full!");
    }
    browser.close();
    res.send();
};
