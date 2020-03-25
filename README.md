# McGill Minerva Automatic register
The goal of this project is to use a cloud service like AWS or GCP. 
Within them, we can create a cron job and make it run a certain amount of time a day.

## Dependencies
* Node.js with Puppeteer

## How To use
1. Modify the content of `example.json` to match yours. 
2. The CRN is a list of all CRN of the class you would like to register. Those can be found on VSB.
3. Rename `example.json` to `credentials.json`

Couple notes:
* Each CRN must be within double quotes `"YOUR_CRN"`
* The `semester`field needs to follow this pattern: YYYYMM
* YYYY represents the academic year
* MM is the semester where Fall is 09, Winter is 01, Summer is 05.\
For example, if I want to register for fall 2020, I would write 202009.\

## How to host on a cloud Service
1. Create a Google Cloud Function with the `gcp.js` content. Use HTTP Trigger, 512mb of ram, function to execute is `handler`.
2. Modify the JSON as needed in the script
3. Once deployed, create Google Cloud Scheduler that calls the function every 1h (with this cron: `* 1 * * *`). (safest time to not get banned from minerva)

## Feature request 
Create an issue and we will talk about it!
