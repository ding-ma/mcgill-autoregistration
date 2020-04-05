const {Registration} = require("./gcp");

// boiler code to call the Registration function
Registration().then(r => {
    console.log(r)
});

