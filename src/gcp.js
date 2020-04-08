const puppeteer = require('puppeteer');
const config = {
    "email": "xx@mail.mcgill.ca",
    "password": "xx",
    "semester": "202005",
    "CRN": ["527", "528", "491", "850", "285", "288", "289"],
    "wantEmail": true
};


exports.Registration = async (req, res) => {
    const sgMail = require('@sendgrid/mail');

    if (config.wantEmail) {
        sgMail.setApiKey('YOUR_API_KEY');
    }

    let browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true //set to false if you want to see browser
    });
    let page = await browser.newPage();

    //URL from vsb
    let url = "https://vsb.mcgill.ca/vsb/criteria.jsp?access=0&lang=en&tip=1&page=results&scratch=0&term=202005&sort=none&filters=iiiiiiiii&bbs=&ds=&cams=Distance_Downtown_Macdonald_Off-Campus&locs=any&isrts=&course_0_0=FACC-300&sa_0_0=&cs_0_0=--202005_527-528-&cpn_0_0=&csn_0_0=&ca_0_0=&dropdown_0_0=al&ig_0_0=0&rq_0_0=&course_1_0=ECON-208&sa_1_0=&cs_1_0=&cpn_1_0=&csn_1_0=&ca_1_0=&dropdown_1_0=al&ig_1_0=0&rq_1_0=&course_2_0=MGCR-222&sa_2_0=&cs_2_0=&cpn_2_0=&csn_2_0=&ca_2_0=&dropdown_2_0=al&ig_2_0=0&rq_2_0=&course_3_0=ANTH-201&sa_3_0=&cs_3_0=&cpn_3_0=&csn_3_0=&ca_3_0=&dropdown_3_0=al&ig_3_0=0&rq_3_0=&course_4_0=ANTH-212&sa_4_0=&cs_4_0=&cpn_4_0=&csn_4_0=&ca_4_0=&dropdown_4_0=al&ig_4_0=0&rq_4_0=&course_5_0=ANTH-227&sa_5_0=&cs_5_0=&cpn_5_0=&csn_5_0=&ca_5_0=&dropdown_5_0=al&ig_5_0=0&rq_5_0=";

    await page.goto(url, {waitUntil: 'networkidle0'});

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
        await page.type('#mcg_un', config.email, {delay: 30});
        await page.type('#mcg_pw', config.password, {delay: 30});
        await page.click('#mcg_un_submit');
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        console.log("Login Successful");
        //navigation to student
        await page.waitForXPath("/html/body/div[1]/div[2]/span/map/table/tbody/tr[1]/td/table/tbody/tr/td[5]", {waitUntil: 'networkidle0'}).then(selector => selector.click());

        //navigates to registration
        /*
        McGill COVD19 changed the xpath old one: /html/body/div[3]/table[1]/tbody/tr[2]/td[2]/a
         */
        await page.waitForXPath("/html/body/div[3]/table[1]/tbody/tr[3]/td[2]/a", {waitUntil: 'networkidle0'}).then(selector => selector.click());
        await page.waitForNavigation();

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
                to: 'xx@gmail.com',
                from: {
                    email: "minervaRegistration@mcgill.ca ",
                    name: "Minerva"
                },
                subject: "Successful Registration For Semester " + config.semester,
                text: "At least one class was registered. Please check minerva https://www.mcgill.ca/minerva"
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
