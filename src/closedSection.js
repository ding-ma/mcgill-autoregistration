const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');

/*
EDIT THE CONFIG BELOW BEFORE RUNNING

This function checks from the course search if the class is not full.

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
    "regEmail": "", //change empty string to your McGill email
    "password": "", //change empty string to your password
    "term": "202009", 
    "subject": "COMP", //
    "courseNumber": "310",
    "url": "https://vsb.mcgill.ca/vsb/criteria.jsp?access=0&lang=en&tip=1&page=results&scratch=0&term=202009&sort=none&filters=iiiiiiiii&bbs=&ds=&cams=Distance_Downtown_Macdonald_Off-Campus&locs=any&isrts=&course_0_0=COMP-310&sa_0_0=&cs_0_0=--202009_18276--&cpn_0_0=&csn_0_0=&ca_0_0=&dropdown_0_0=us_--202009_18276--&ig_0_0=0&rq_0_0=",
    "wantEmail": true,
    "notifEmail": "",
    "sgApiKey": "SG.xxx..."
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

exports.closedsection = async(req, res) => {


        let browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: false //set to false if you want to see browser
        });
        let page = await browser.newPage();

        console.log("Logging in...");

        await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin', {waitUntil: 'networkidle0'});
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
        console.log("Course " + config.subject +config.courseNumber+ " found, proceed to check availability");

        try {

        //check the checkbox if there is one and register for course
        await page.waitForXPath("/html/body/div[3]/form/table/tbody/tr[3]/td[1]/input[1]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitForXPath("/html/body/div[3]/form/input[7]", {waitUntil: 'networkidle0'}).then(selector => selector.click());


        console.log("Successfully registered.")
        
        if(config.wantEmail){
            await sendEmail()
        }
    }

    catch(e){
        console.log("Registration for " + config.subject+config.courseNumber + " failed.")
    }

    
    browser.close()
}


