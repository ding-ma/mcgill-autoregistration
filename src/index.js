const {multiclass} = require("./multiclassRegister");
const {waitlist} = require("./waitlist")

// boiler code to call the Registration function
// multiclass().then(r => {
//     console.log(r)
// });


waitlist().then(r => {
    console.log(r)
});
