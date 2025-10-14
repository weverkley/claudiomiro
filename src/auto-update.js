const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

/**
 * Obtém a versão atual do pacote
 */
function getCurrentVersion() {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
}

/**
 * Obtém a última versão disponível no npm
 */
async function getLatestVersion(packageName) {
    try {
        const result = execSync(`npm view ${packageName} version`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return result.trim();
    } catch (error) {
        // Se houver erro ao consultar npm, retorna null
        return null;
    }
}

/**
 * Verifica se há atualizações disponíveis e notifica o usuário
 */
async function checkForUpdates(packageName = 'claudiomiro', options = {}) {
    const { silent = false, autoUpdate = false } = options;

    try {
        const currentVersion = getCurrentVersion();
        const latestVersion = await getLatestVersion(packageName);

        if (!latestVersion) {
            // Não foi possível verificar atualizações
            return { updateAvailable: false, currentVersion, latestVersion: null };
        }

        // Se as versões são diferentes, há atualização disponível
        if (latestVersion !== currentVersion) {
            // Há uma nova versão disponível
            if (!silent) {
                logger.newline();
                logger.warn(`┌${'─'.repeat(60)}┐`);
                logger.warn(`│  Update available: ${currentVersion} → ${latestVersion}${' '.repeat(60 - 36 - currentVersion.length - latestVersion.length)}│`);
                logger.warn(`│  Run: npm install -g ${packageName}${' '.repeat(60 - 25 - packageName.length)}│`);
                logger.warn(`└${'─'.repeat(60)}┘`);
                logger.newline();
            }

            if (autoUpdate) {
                logger.info('Auto-updating...');
                try {
                    execSync(`npm install -g ${packageName}@latest`, {
                        stdio: 'inherit'
                    });
                    logger.success(`Successfully updated to version ${latestVersion}`);
                    logger.info('Please restart the command.');
                    process.exit(0);
                } catch (error) {
                    logger.error('Failed to auto-update. Please update manually.');
                }
            }

            return { updateAvailable: true, currentVersion, latestVersion };
        }

        return { updateAvailable: false, currentVersion, latestVersion };
    } catch (error) {
        // Em caso de erro, não interrompe a execução
        return { updateAvailable: false, currentVersion: getCurrentVersion(), latestVersion: null, error: error.message };
    }
}

/**
 * Verifica atualizações de forma não-bloqueante
 * Mostra notificação se houver atualização disponível
 */
function checkForUpdatesAsync(packageName = 'claudiomiro', options = {}) {
    // Executa a verificação em background sem bloquear a execução
    setImmediate(async () => {
        try {
            await checkForUpdates(packageName, options);
        } catch (error) {
            // Ignora erros silenciosamente
        }
    });
}

module.exports = {
    checkForUpdates,
    checkForUpdatesAsync,
    getCurrentVersion,
    getLatestVersion
};
