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

exports.closedSection = async (req, res) => {


    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true //set to false if you want to see browser
    });
    let page = await browser.newPage();

    console.log("Logging in...");

    await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin');
    await page.waitForNavigation();


    //logs in
    await page.type('#mcg_un', config.regEmail, {delay: 30});
    await page.type('#mcg_pw', config.password, {delay: 30});
    await page.click('#mcg_un_submit');
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    console.log("Login Successful");

    await page.goto("https://horizon.mcgill.ca/pban1/bwskfcls.p_sel_crse_search", {waitUntil: 'networkidle0'})

    //selects the term and navigates to next page
    await page.select('select[name="p_term"]', config.term);
    await page.waitForXPath("/html/body/div[3]/form/input[3]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
    await page.waitForNavigation();
    console.log("Term " + config.term + " found, proceed to subject");

    //selects the Subject and search for course
    await page.select('#subj_id', config.subject);
    await page.waitForXPath("/html/body/div[3]/form/input[17]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
    await page.waitForNavigation();
    console.log("Subject " + config.subject + " found, proceed to select course");

    //select the course and proceed to check availability
    await page.waitForXPath("/html/body/div[3]/table[2]/tbody/tr[14]/td[3]/form/input[30]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
    await page.waitForNavigation();
    console.log("Course " + config.subject + config.courseNumber + " found, proceed to check availability");

    try {
        await page.refresh()
        //check the checkbox if there is one and register for course
        await page.waitForXPath("/html/body/div[3]/form/table/tbody/tr[3]/td[1]/input[1]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitForXPath("/html/body/div[3]/form/input[7]", {waitUntil: 'networkidle0'}).then(selector => selector.click());


        console.log("Successfully registered.")

        if (config.wantEmail) {
            await sendEmail()
        }
    } catch (e) {
        console.log("Registration for " + config.subject + config.courseNumber + " failed.")
    }


    browser.close()
}


