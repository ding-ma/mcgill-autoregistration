const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();


const config = {
    "regEmail": process.env.EMAIL,
    "password": process.env.PASSWORD,
    "term": process.env.TERM,
    "CRN": process.env.CRN.split(","),
    "url": process.env.VSB_URL,
    "wantEmail": process.env.WANT_EMAIL,
    "notifEmail": process.env.NOTIF_EMAIL,
    "sgApiKey": process.env.SG_API_KEY
};

async function determineRegistrableClass(page) {
    //should be just be able to do crn.length as these classes does not have tutorial
    let availableClass = [];
    for (let i = 1; i <= config.numberClass; i++) {
        const selector = "#legend_box > div:nth-child(" + i + ") > div > div > div > label > div > div.selection_table > table";
        const table = await page.$$eval(selector, trs => trs.map(tr => {
            const tds = [...tr.getElementsByTagName('td')];
            return tds.map(td => td.textContent);
        }));
        const lectureContent = table[0][1];
        //CRN:[0-9]+
        //Seats:.+?(?=Waitlist)
        //Waitlist:.*
        try {
            const courseCRN = lectureContent.match("CRN:[0-9]+")[0]
            const courseSeats = lectureContent.match("Seats:.+?(?=Waitlist)")[0]
            const courseWaitList = lectureContent.match("Waitlist:.*")[0]

            if (courseWaitList.includes("None") && !courseSeats.includes("Full")) {
                availableClass.push(courseCRN.split(":")[1])
            }
            if (!courseWaitList.includes("Full") && !courseSeats.includes("Full")) {
                availableClass.push(courseCRN.split(":")[1])
            }

        } catch (e) {
            const courseCRN = lectureContent.match("CRN:[0-9]+")[0]
            const courseSeats = lectureContent.match("Seats:.")[0]
            if (!courseSeats.includes("Full")) {
                availableClass.push(courseCRN.split(":")[1])
            }
        }
    }

    return availableClass;
}

async function sendEmail() {
    sgMail.setApiKey(config.sgApiKey);
    let msg = {
        to: config.notifEmail,
        from: {
            email: "minerva.registration@mcgill.ca ",
            name: "Minerva"
        },
        subject: "Successful Registration For Semester " + config.term,
        text: "At least one class was registered. Please check minerva @ www.mcgill.ca/minerva."
    };
    await sgMail.send(msg)
    console.log("Email Sent!");
}

exports.waitlist = async (req, res) => {

    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true //set to false if you want to see browser
    });
    let page = await browser.newPage();

    await page.goto(config.url, {waitUntil: 'networkidle0'});


    let classToRegister = await determineRegistrableClass(page);

    if (classToRegister.length > 0) {

        console.log("Preparing to register");

        await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin', {waitUntil: 'networkidle0'});

        //logs in
        await page.type('#mcg_un', config.regEmail, {delay: 30});
        await page.type('#mcg_pw', config.password, {delay: 30});
        await page.click('#mcg_un_submit');
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        console.log("Login Successful");

        await page.goto("https://horizon.mcgill.ca/pban1/bwskfreg.P_AltPin", {waitUntil: 'networkidle0'})

        //selects the term and navigates to next page
        await page.select('#term_id', config.term);
        await page.waitForXPath("/html/body/div[3]/form/input", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitForNavigation();
        console.log("Term " + config.term + " found, Starting to input CRNs");
        //inputs all the crn and submits them
        for (let i = 0; i < classToRegister.length; i++) {
            let inputID = "#crn_id" + (i + 1);
            let crn = classToRegister[i];
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
            await sendEmail()
        }
    } else {
        console.log("Class is full!");
    }
    browser.close();
};
