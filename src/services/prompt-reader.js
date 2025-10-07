const readline = require('readline');
const chalk = require('chalk');
const logger = require('../../logger');

const getMultilineInput = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        let lines = [];
        let isFirstLine = true;

        console.log();
        console.log(chalk.bold.cyan('─────────────────────────────────────────────'));
        console.log(chalk.white('Describe what you need help with:'));
        console.log(chalk.bold.cyan('─────────────────────────────────────────────'));
        console.log(chalk.gray('✓ Write or paste your task description'));
        console.log(chalk.gray('✓ Paste code, URLs, or drag & drop file paths') );
        console.log(chalk.gray('✓ Press ENTER twice to submit') );
        console.log(chalk.gray('✓ Press Ctrl+C to cancel'));
        console.log(chalk.bold.cyan('─────────────────────────────────────────────'));
        console.log();
        process.stdout.write(chalk.cyan('🤖 > '));

        rl.on('line', (line) => {
            if (line.trim() === '' && lines.length > 0 && lines[lines.length - 1].trim() === '') {
                // Segunda linha vazia consecutiva - finaliza
                rl.close();
                const result = lines.slice(0, -1).join('\n').trim();
                resolve(result);
            } else {
                lines.push(line);
                if (!isFirstLine) {
                    process.stdout.write(chalk.cyan('    '));
                }
                isFirstLine = false;
            }
        });

        rl.on('SIGINT', () => {
            rl.close();
            console.log();
            logger.error('Operation cancelled');
            process.exit(0);
        });
    });
};

module.exports = { getMultilineInput };
