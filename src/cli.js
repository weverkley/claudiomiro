const fs = require('fs');
const path = require('path');
const logger = require('../logger');
const state = require('./config/state');
const { startFresh } = require('./services/file-manager');
const { isFullyImplemented } = require('./utils/validation');
const { step1, step2, step3, step4, step5, codeReview } = require('./steps');
const { step0 } = require('./steps/step0');

const chooseAction = async (i) => {
    // Verifica se --prompt foi passado e extrai o valor
    const promptArg = process.argv.find(arg => arg.startsWith('--prompt='));
    const promptText = promptArg ? promptArg.split('=').slice(1).join('=').replace(/^["']|["']$/g, '') : null;

    // Verifica se --maxCycles foi passado e extrai o valor
    const maxCyclesArg = process.argv.find(arg => arg.startsWith('--maxCycles='));
    const maxCycles = maxCyclesArg ? parseInt(maxCyclesArg.split('=')[1], 10) : 15;

    // Verifica se --fresh foi passado (ou se --prompt foi usado, que automaticamente ativa --fresh)
    const shouldStartFresh = process.argv.includes('--fresh') || promptText !== null;

    // Verifica se --push=false foi passado
    const shouldPush = !process.argv.some(arg => arg === '--push=false');

    // Verifica se --same-branch foi passado
    const sameBranch = process.argv.includes('--same-branch');

    // Filtra os argumentos para pegar apenas o diretório (remove --fresh, --push=false, --same-branch, --prompt e --maxCycles)
    const args = process.argv.slice(2).filter(arg => arg !== '--fresh' && !arg.startsWith('--push') && arg !== '--same-branch' && !arg.startsWith('--prompt') && !arg.startsWith('--maxCycles'));
    const folderArg = args[0] || process.cwd();

    // Resolve o caminho absoluto e define a variável global
    state.setFolder(folderArg);

    if (!fs.existsSync(state.folder)) {
        logger.error(`Folder does not exist: ${state.folder}`);
        process.exit(1);
    }

    logger.path(`Working directory: ${state.folder}`);
    logger.newline();

    if(shouldStartFresh && i === 0){
        startFresh();
    }

    if(!fs.existsSync(state.claudiomiroFolder)){
        return { step: step0(sameBranch), maxCycles };
    }

    const tasks = fs
    .readdirSync(state.claudiomiroFolder)
    .filter(name => {
        const fullPath = path.join(state.claudiomiroFolder, name);
        return fs.statSync(fullPath).isDirectory();
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));


    for(const task of tasks){
        if(fs.existsSync(path.join(state.claudiomiroFolder, task, 'GITHUB_PR.md'))){
            logger.info(`${task} is done`);
            continue;
        }

        logger.info(`Working in task ${task}...`);

        if(fs.existsSync(path.join(state.claudiomiroFolder, task, 'TODO.md'))){
            if(!isFullyImplemented(path.join(state.claudiomiroFolder, task, 'TODO.md'))){
                logger.step(3, 'Implementing tasks');
                return { step: step3(task), maxCycles };
            }


            if(
                isFullyImplemented(path.join(state.claudiomiroFolder, task, 'TODO.md')) 
            ){
                if(fs.existsSync(path.join(state.claudiomiroFolder, task, 'CODE_REVIEW.md'))){
                    logger.step(4, 'Running tests and creating PR');
                    return { step: step4(task), maxCycles };
                }else{
                    logger.step(3.1, 'Running code');
                    return { step: codeReview(task), maxCycles };
                }
            }
        }


        if(fs.existsSync(path.join(state.claudiomiroFolder, task, 'PROMPT.md'))){
            logger.step(2, 'Research and planning');
            return { step: step2(task), maxCycles };
        }

        logger.step(1, 'Initialization');
        return { step: step1(task), maxCycles };
    }

    logger.info(`All tasks are done...`);

    if(fs.existsSync(path.join(state.folder, 'GITHUB_PR.md'))){
        logger.step(5, 'Creating pull request and committing');
        return { step: step5(tasks, shouldPush), maxCycles };
    }
}

const init = async () => {
    logger.banner();

    let i = 0;
    let maxCycles = 15;

    while(i < maxCycles){
        const result = await chooseAction(i);
        if (result && result.maxCycles) {
            maxCycles = result.maxCycles;
        }
        if (result && result.step) {
            await result.step;
        }
        i++;
    }

    logger.error(`Maximum iteration limit reached (${maxCycles} cycles)`);
    logger.box(`The agent has completed ${maxCycles} cycles. Please review the progress and restart if needed.`, {
        borderColor: 'yellow',
        title: 'Limit Reached'
    });
}

module.exports = { init };
