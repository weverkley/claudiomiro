const chalk = require('chalk');
const ora = require('ora');
const logSymbols = require('log-symbols');
const boxen = require('boxen');
const gradient = require('gradient-string');

class Logger {
    constructor() {
        this.spinner = null;
        this.indentLevel = 0;
    }

    getIndent() {
        return '  '.repeat(this.indentLevel);
    }

    // Banner inicial
    banner() {
        const title = gradient.pastel.multiline([
            '╔═══════════════════════════════════════╗',
            '║                                       ║',
            '║           CLAUDIOMIRO v1.3            ║',
            '║     AI-Powered Development Agent      ║',
            '║                                       ║',
            '╚═══════════════════════════════════════╝'
        ].join('\n'));
        console.log('\n' + title + '\n');
    }

    // Logs básicos
    info(message) {
        console.log(`${this.getIndent()}${logSymbols.info} ${chalk.cyan(message)}`);
    }

    success(message) {
        console.log(`${this.getIndent()}${logSymbols.success} ${chalk.green(message)}`);
    }

    warning(message) {
        console.log(`${this.getIndent()}${logSymbols.warning} ${chalk.yellow(message)}`);
    }

    error(message) {
        console.log(`${this.getIndent()}${logSymbols.error} ${chalk.red(message)}`);
    }

    // Log de step/fase
    step(task, tasks, number, message) {
        const tasksText = chalk.bold.white(`[TASK ${task}/${tasks}]`);

        const stepText = chalk.bold.white(`[STEP ${number}]`);
        const arrow = chalk.gray('→');
        console.log(`\n${tasksText} ${stepText} ${arrow} ${chalk.cyan(message)}\n`);
    }

    // Box para mensagens importantes
    box(message, options = {}) {
        const boxConfig = {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            ...options
        };
        console.log(boxen(message, boxConfig));
    }

    // Spinner para operações em progresso
    startSpinner(text) {
        if (this.spinner) {
            this.spinner.stop();
        }
        this.spinner = ora({
            text: chalk.cyan(text),
            color: 'cyan',
            spinner: 'dots'
        }).start();
    }

    updateSpinner(text) {
        if (this.spinner) {
            this.spinner.text = chalk.cyan(text);
        }
    }

    succeedSpinner(text) {
        if (this.spinner) {
            this.spinner.succeed(chalk.green(text));
            this.spinner = null;
        }
    }

    failSpinner(text) {
        if (this.spinner) {
            this.spinner.fail(chalk.red(text));
            this.spinner = null;
        }
    }

    stopSpinner() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
    }

    // Log de diretório/arquivo
    path(message) {
        console.log(`${this.getIndent()}${chalk.gray('📁')} ${chalk.blue(message)}`);
    }

    // Log de comando executado
    command(cmd) {
        console.log(`${this.getIndent()}${chalk.gray('$')} ${chalk.magenta(cmd)}`);
    }

    // Separador visual
    separator() {
        console.log(chalk.gray('─'.repeat(50)));
    }

    // Aumentar indentação
    indent() {
        this.indentLevel++;
    }

    // Diminuir indentação
    outdent() {
        this.indentLevel = Math.max(0, this.indentLevel - 1);
    }

    // Reset indentação
    resetIndent() {
        this.indentLevel = 0;
    }

    // Log de tarefa
    task(message) {
        console.log(`${this.getIndent()}${chalk.gray('▸')} ${chalk.white(message)}`);
    }

    // Log de subtarefa
    subtask(message) {
        console.log(`${this.getIndent()}  ${chalk.gray('•')} ${chalk.gray(message)}`);
    }

    // Log de progresso
    progress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const bar = this.createProgressBar(percentage);
        const msg = message ? ` ${chalk.gray(message)}` : '';
        console.log(`${this.getIndent()}${bar} ${chalk.cyan(`${percentage}%`)}${msg}`);
    }

    createProgressBar(percentage) {
        const width = 20;
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    }

    // Limpar console
    clear() {
        console.clear();
    }

    // Nova linha
    newline() {
        console.log();
    }
}

module.exports = new Logger();
