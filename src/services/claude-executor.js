const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const logger = require('../../logger');
const state = require('../config/state');

const executeClaude = (text) => {
    return new Promise((resolve, reject) => {
        // Create temporary file for the prompt
        const tmpFile = path.join(os.tmpdir(), `claudiomiro-prompt-${Date.now()}.txt`);
        fs.writeFileSync(tmpFile, text, 'utf-8');

        // Use sh to execute command with cat substitution
        const command = `claude --dangerously-skip-permissions -p "$(cat '${tmpFile}')" --output-format stream-json --verbose`;

        logger.stopSpinner();
        logger.command(`claude --dangerously-skip-permissions -p --output-format stream-json (in ${state.folder})`);
        logger.separator();
        logger.newline();

        const claude = spawn('sh', ['-c', command], {
            cwd: state.folder,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        const logFilePath = path.join(state.folder, '.claudiomiro_log.txt');
        const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

        // Log separator with timestamp
        const timestamp = new Date().toISOString();
        logStream.write(`\n\n${'='.repeat(80)}\n`);
        logStream.write(`[${timestamp}] Claude execution started\n`);
        logStream.write(`${'='.repeat(80)}\n\n`);

        let buffer = '';

        // Captura stdout e processa JSON streaming
        claude.stdout.on('data', (data) => {
            const output = data.toString();
            // Adiciona ao buffer
            buffer += output;

            // Processa linhas completas
            const lines = buffer.split('\n');

            // A última linha pode estar incompleta, então mantém no buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);

                    for(const msg of json.message.content){
                        if(msg.text){
                            logger.info('💬 Claude:');
                            console.log(msg.text);
                        }
                        else if(msg.content){
                            logger.info('💬 Claude:');
                            console.log(msg.content);
                        }
                        else if (msg.type === 'error') {
                            // Error
                            logger.error(`❌ Claude: ${msg.error?.message || 'Unknown error'}`);
                        } else {
                            logger.info('💬 Claude: '  + msg.type + '...');
                        }
                    }
                } catch (e) {
                    logger.error(line);
                }
            }

            // Log to file
            logStream.write(output);
        });

        // Captura stderr
        claude.stderr.on('data', (data) => {
            const output = data.toString();
            process.stderr.write(output);
            logStream.write('[STDERR] ' + output);
        });

        // Quando o processo terminar
        claude.on('close', (code) => {
            // Clean up temporary file
            try {
                if (fs.existsSync(tmpFile)) {
                    fs.unlinkSync(tmpFile);
                }
            } catch (err) {
                logger.error(`Failed to cleanup temp file: ${err.message}`);
            }

            logStream.write(`\n\n[${new Date().toISOString()}] Claude execution completed with code ${code}\n`);
            logStream.end();

            logger.newline();
            logger.separator();

            if (code !== 0) {
                logger.error(`Claude exited with code ${code}`);
                reject(new Error(`Claude exited with code ${code}`));
            } else {
                logger.success('Claude execution completed');
                resolve();
            }
        });

        // Tratamento de erro
        claude.on('error', (error) => {
            // Clean up temporary file on error
            try {
                if (fs.existsSync(tmpFile)) {
                    fs.unlinkSync(tmpFile);
                }
            } catch (err) {
                logger.error(`Failed to cleanup temp file: ${err.message}`);
            }

            logStream.write(`\n\nERROR: ${error.message}\n`);
            logStream.end();
            logger.error(`Failed to execute Claude: ${error.message}`);
            reject(error);
        });
    });
}

module.exports = { executeClaude };
