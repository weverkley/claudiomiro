const { commitOrFix } = require("./src/services/git-commit");


const init = async() => {
    await commitOrFix(
        'test', 
        false
    );
}
init();