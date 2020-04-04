# McGill Minerva Automatic register
The goal of this project is to use a cloud service like AWS or GCP. 
Within them, we can create a cron job and make it run a certain amount of time a day.

WARNING: This program is to be used with people with knowledge in CLOUD and node.js. I tried my best to make the instructions clear but anyone with any prior knowledge should be able to figure things out. Contact me if you need help!
## Dependencies
* Node.js with Puppeteer

## How To use
1. Go on VSB and copy the URL after you have chosen your classes.
2. Modify the content of `example.json` to match yours. 
3. The CRN is a list of all CRN of the class you would like to register. Those can be found on VSB.
4. Rename `example.json` to `credentials.json`.

Couple notes:
* Each CRN must be within double quotes `"YOUR_CRN"`
* The `semester`field needs to follow this pattern: YYYYMM
* YYYY represents the academic year
* MM is the semester where Fall is 09, Winter is 01, Summer is 05.\
For example, if I want to register for fall 2020, I would write 202009.
* The script checks on vsb first to see if there are spots in the class. If so, it will proceed to register on Minerva
* To use the email feature, you will need to sign up an account on [_sendgrid_](https://sendgrid.com/). Copy down the API key and use it in the program.

## How to host on a cloud Service
1. Create a Google Cloud Function with the `gcp.js` content. Use HTTP Trigger, 512mb of ram, function to execute is `handler`.
2. Use the following ``package.json`` for the cloud functions.
```
{
  "name": "mcgill-autoregistration",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "index.handler"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "puppeteer": "^2.1.1"
  }
}
```
3. Modify the config JSON as needed in the script.
4. Once deployed, create Google Cloud Scheduler that calls the url generated by the function with a ``POST`` request and empty body. Recommended time is every 1h to not get banned from minerva, with this cron: `* 1 * * *`. \
4.1 If you would like to customize the time use this [amazing tool](https://crontab.guru/)

Example of a GCP log:
![image](https://user-images.githubusercontent.com/43629633/77568368-e7bc8000-6e9e-11ea-94e1-d484b97ddf65.png)

## Upcoming features and todos
- [ ] Ping VSB, and check if the class is free. If yes, proceed to register. 
- [ ] Log files generated by local script.
- [ ] Make code more modular (Help needed!). 

## Feature request 
Create an issue and we will talk about it!
