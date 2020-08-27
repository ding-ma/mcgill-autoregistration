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
    "regEmail": "yiyi.yang3@mail.mcgill.ca", //change empty string to your McGill email
    "password": "yang12", //change empty string to your password
    "term": "202009", 
    "CRN": ["18276"],
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
        headless: true //set to false if you want to see browser
    });
    let page = await browser.newPage();

    console.log("Logging in...");

    await page.goto('https://horizon.mcgill.ca/pban1/twbkwbis.P_WWWLogin', {waitUntil: 'networkidle0'});

    //logs in
    await page.type('#mcg_un', config.regEmail, {delay: 30});
    await page.type('#mcg_pw', config.password, {delay: 30});
    await page.click('#mcg_un_submit');
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    console.log("Login Successful");

    await page.goto("https://horizon.mcgill.ca/pban1/bwskfcls.p_sel_crse_search", {waitUntil: 'networkidle0'})

    //selects the term and navigates to next page
    await page.select('#term_id', config.term);
    await page.waitForXPath("/html/body/div[3]/form/input", {waitUntil: 'networkidle0'}).then(selector => selector.click());
    await page.waitForNavigation();
    console.log("Term " + config.term + " found, proceed to subject");

    //selects the Subject and search for course\
    await page.select('#sub_id', config.subject);
    await page.waitForXPath("/html/body/div[3]/form/input[17]", {waitUntil: 'networkidle0'}).then(selector => selector.click());
    await page.waitForNavigation();
    console.log("Subject " + config.subject + " found, proceed to select course");

    //select the course and proceed to check availability
    var parentElement;
    for(let i = 0; i<document.length; i++){
        let navigator = document.querySelectorAll('input[name=SEL_CRSE]')[i]
        if(navigator == config.courseNumber){
            parentElement  = navigator.parentElement
            break
        }
    }
    for(let i = 0; i<document.length; i++){
        let navigator = parentElement.childElement[i]
        if(navigator.name == "SUB_BTN"){
            navigator.click()
        }
    }
    await page.waitForNavigation();
    console.log("Course " + config.subject +config.courseNumber+ " found, proceed to check availability");


    //check if the section is full
    if(document.querySelectorAll('abbr')[13].title != "Closed"){
        selector => selector.click() //or document.querySelectorAll('input[value=Register]')[0].click()

        if (config.wantEmail) {
            await sendEmail()
        }
    }
    else{
        console.log("Section is currently full")
    }




    
    browser.close()
    res.send()
}
