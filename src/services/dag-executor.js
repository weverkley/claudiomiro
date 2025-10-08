const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../../logger');
const state = require('../config/state');
const { step2, step3, step4, codeReview } = require('../steps');
const { isFullyImplemented } = require('../utils/validation');

class DAGExecutor {
  constructor(tasks, allowedSteps = null, maxConcurrent = null) {
    this.tasks = tasks; // { TASK1: {deps: [], status: 'pending'}, ... }
    this.allowedSteps = allowedSteps; // null = todos os steps, ou array de números
    // 2 por core, máximo 5, ou valor customizado via --maxConcurrent
    this.maxConcurrent = maxConcurrent || Math.min(5, os.cpus().length * 2);
    this.running = new Set(); // Tasks atualmente em execução
  }

  /**
   * Verifica se um step deve ser executado
   */
  shouldRunStep(stepNumber) {
    if (!this.allowedSteps) return true;
    return this.allowedSteps.includes(stepNumber);
  }

  /**
   * Retorna tasks que podem rodar agora:
   * - status === 'pending'
   * - todas as dependências foram completadas
   */
  getReadyTasks() {
    return Object.entries(this.tasks)
      .filter(([name, task]) =>
        task.status === 'pending' &&
        task.deps.every(dep => this.tasks[dep] && this.tasks[dep].status === 'completed')
      )
      .map(([name]) => name);
  }

  /**
   * Executa uma "onda" de tasks em paralelo
   * @returns {boolean} true se executou pelo menos uma task
   */
  async executeWave() {
    const ready = this.getReadyTasks();
    const availableSlots = this.maxConcurrent - this.running.size;
    const toExecute = ready.slice(0, availableSlots);

    if (toExecute.length === 0) {
      return false;
    }

    logger.info(`🚀 Running ${toExecute.length} task(s) in parallel: ${toExecute.join(', ')}`);

    // Marca como running
    toExecute.forEach(task => {
      this.tasks[task].status = 'running';
      this.running.add(task);
    });

    // Executa em paralelo
    const promises = toExecute.map(task => this.executeTask(task));
    await Promise.allSettled(promises);

    return true;
  }

  /**
   * Executa o ciclo completo de uma task: step2 → step3 → codeReview → step4
   * (step1 foi incorporado ao step0 e já criou PROMPT.md)
   */
  async executeTask(taskName) {
    try {
      logger.info(`▶️  Starting ${taskName}...`);

      const taskPath = path.join(state.claudiomiroFolder, taskName);

      // Verifica se já está completa (tem GITHUB_PR.md)
      if (fs.existsSync(path.join(taskPath, 'GITHUB_PR.md'))) {
        logger.info(`✅ ${taskName} already completed`);
        this.tasks[taskName].status = 'completed';
        this.running.delete(taskName);
        return;
      }

      // PROMPT.md já foi criado pelo step0, então começamos direto no step2

      // Step 2: Planejamento (PROMPT.md → TODO.md)
      if (!fs.existsSync(path.join(taskPath, 'TODO.md'))) {
        if (!this.shouldRunStep(2)) {
          logger.info(`  ${taskName}: Step 2 skipped (not in --steps list)`);
          this.tasks[taskName].status = 'completed';
          this.running.delete(taskName);
          return;
        }
        logger.info(`  ${taskName}: Step 2 - Research and planning`);
        await step2(taskName);
      }

      // Se step 2 foi executado e não devemos executar step 3, para aqui
      if (!this.shouldRunStep(3)) {
        logger.info(`  ${taskName}: Step 3 skipped (not in --steps list)`);
        this.tasks[taskName].status = 'completed';
        this.running.delete(taskName);
        return;
      }

      // Loop até implementação completa
      let maxAttempts = 15; // Limite de segurança
      let attempts = 0;

      while (attempts < maxAttempts) {
        attempts++;

        // Step 3: Implementação
        if (!isFullyImplemented(path.join(taskPath, 'TODO.md'))) {
          logger.info(`  ${taskName}: Step 3 - Implementing tasks (attempt ${attempts})`);
          await step3(taskName);
          continue; // Volta para verificar se está implementado
        }

        // Step 3.1: Code Review
        if (!fs.existsSync(path.join(taskPath, 'CODE_REVIEW.md'))) {
          logger.info(`  ${taskName}: Step 3.1 - Code review`);
          await codeReview(taskName);
          continue; // Volta para verificar se precisa refazer
        }

        // Se step 3 foi executado e não devemos executar step 4, para aqui
        if (!this.shouldRunStep(4)) {
          logger.info(`  ${taskName}: Step 4 skipped (not in --steps list)`);
          this.tasks[taskName].status = 'completed';
          this.running.delete(taskName);
          return;
        }

        // Step 4: Testes finais e PR
        if (!fs.existsSync(path.join(taskPath, 'GITHUB_PR.md'))) {
          logger.info(`  ${taskName}: Step 4 - Running tests and creating PR`);
          await step4(taskName);

          // Verifica se step4 criou o PR ou voltou para TODO
          if (fs.existsSync(path.join(taskPath, 'GITHUB_PR.md'))) {
            break; // Completou!
          }
          // Se não criou PR, continua o loop (step4 deve ter resetado TODO.md)
          continue;
        }

        // Se chegou aqui, tem GITHUB_PR.md, terminou!
        break;
      }

      if (attempts >= maxAttempts) {
        throw new Error(`Maximum attempts (${maxAttempts}) reached for ${taskName}`);
      }

      this.tasks[taskName].status = 'completed';
      this.running.delete(taskName);
      logger.success(`✅ ${taskName} completed successfully`);
    } catch (error) {
      this.tasks[taskName].status = 'failed';
      this.running.delete(taskName);
      logger.error(`❌ ${taskName} failed: ${error.message}`);
      throw error; // Propaga o erro
    }
  }

  /**
   * Executa todas as tasks respeitando dependências
   */
  async run() {
    const coreCount = os.cpus().length;
    const defaultMax = Math.min(5, coreCount * 2);
    const isCustom = this.maxConcurrent !== defaultMax;

    logger.info(`Starting DAG executor with max ${this.maxConcurrent} concurrent tasks${isCustom ? ' (custom)' : ` (${coreCount} cores × 2, capped at 5)`}`);
    logger.newline();

    while (true) {
      const hasMore = await this.executeWave();

      if (!hasMore && this.running.size === 0) {
        // Não há mais tasks prontas e nenhuma está rodando
        break;
      }

      if (!hasMore && this.running.size > 0) {
        // Aguarda tasks em execução completarem
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Verifica se alguma task falhou
    const failed = Object.entries(this.tasks)
      .filter(([, task]) => task.status === 'failed')
      .map(([name]) => name);

    const pending = Object.entries(this.tasks)
      .filter(([, task]) => task.status === 'pending')
      .map(([name]) => name);

    logger.newline();
    if (failed.length > 0) {
      logger.error(`Failed tasks: ${failed.join(', ')}`);
    }

    if (pending.length > 0) {
      logger.info(`Tasks still pending (check dependencies): ${pending.join(', ')}`);
    }

    const completed = Object.entries(this.tasks)
      .filter(([, task]) => task.status === 'completed')
      .map(([name]) => name);

    logger.success(`Completed ${completed.length}/${Object.keys(this.tasks).length} tasks`);
  }
}

module.exports = { DAGExecutor };
