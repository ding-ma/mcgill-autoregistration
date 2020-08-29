const {multiclass} = require("./multiclassRegister");
const {waitlist} = require("./waitlist")
const {closedsection} = require("./closedSection")

// boiler code to call the Registration function
// multiclass().then(r => {
//     console.log(r)
// });


closedsection().then(r => {
    console.log(r)
});
