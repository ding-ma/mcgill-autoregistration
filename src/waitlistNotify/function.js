const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');

/*
EDIT THE CONFIG BELOW BEFORE RUNNING

THIS PROGRAM only takes in a class schedule WITHOUT conflicts. If there are schedule conflict, run 2 jobs :')

email: McGill Minerva username
password: McGill Minerva password
Term - Term you wish to register for, found in VSB URL (ex. term=202005)
CRN - class CRN that you wish to register along with the tutorials
url - Select the ONLY class you want on VSB for your selected term then copy the URL over
wantEmail - Set to true if you want an email notification upon successful registration
notifEmail - Where to send notification email to, leave blank if wantEmail is false
sgApiKey - Received when registered for sendgrid, leave blank is wantEmail is false
*/

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
            email: "minerva.registration@mcgill.ca",
            name: "Minerva"
        },
        subject: "Waitlist Position Available for " + config.subject + " " + config.courseNumber,
        text: "A spot has open up for " + config.subject + " " + config.courseNumber + ", please go to www.mcgill.ca/minerva to register as soon as possible."
    };
    await sgMail.send(msg)
    console.log("Email Sent!");
}

exports.waitlistNotify = async(req, res) => {


        let browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: false //set to false if you want to see browser
        });
        let page = await browser.newPage();

        console.log("Logging in...");

        const navigationPromise = page.waitForNavigation(); 
        await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_GenMenu?name=bmenu.P_RegMnu', {waitUntil: 'networkidle0'});
        // await page.waitForNavigation();
        await navigationPromise;



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
        //##########################Change the XPath of the button of the desired course######
        await page.waitForXPath("/html/body/div[3]/table[2]/tbody/tr[17]/td[3]/form/input[30]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        //####################################################################################
        await page.waitForNavigation();
        console.log("Course " + config.subject +config.courseNumber+ " found, proceed to check availability");

        try {

        const data = await page.$$eval('table tr td', tds => tds.map((td) => {
            return td.innerText;
          }));

        let string = '0';
        if(data[35].localeCompare(string)!=0){
            await sendEmail()
        }
        else{
            console.log("Waitlist full")
        }

    }

    catch(e){
        console.log("Registration for " + config.subject+config.courseNumber + " failed.")
    }

    
    browser.close()
}

