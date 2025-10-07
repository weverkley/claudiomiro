# Otimizações de Performance - Claudiomiro

## 1. Paralelização de TASKs Independentes (PRIORIDADE ALTA)

### Problema Atual
O fluxo executa todas as TASKs sequencialmente, mesmo quando não há dependências entre elas.

### Solução: Sistema de Execução Paralela com DAG

#### 1.1. Sistema de Dependências

Modificar `step0` para incluir dependências em cada TASK:

```javascript
// TASK1/TASK.md
/**
 * @dependencies []  // pode rodar imediatamente
 */

// TASK2/TASK.md
/**
 * @dependencies []  // pode rodar imediatamente
 */

// TASK3/TASK.md
/**
 * @dependencies [TASK1, TASK2]  // espera TASK1 e TASK2
 */
```

#### 1.2. DAG Executor (novo arquivo: `src/services/dag-executor.js`)

```javascript
class DAGExecutor {
  constructor(tasks) {
    this.tasks = tasks; // { TASK1: {deps: [], status: 'pending'}, ... }
    this.maxConcurrent = 3; // máximo de TASKs simultâneas
  }

  // Retorna TASKs que podem rodar agora
  getReadyTasks() {
    return Object.entries(this.tasks)
      .filter(([name, task]) =>
        task.status === 'pending' &&
        task.deps.every(dep => this.tasks[dep].status === 'completed')
      )
      .map(([name]) => name);
  }

  // Executa uma "onda" de TASKs em paralelo
  async executeWave() {
    const ready = this.getReadyTasks().slice(0, this.maxConcurrent);

    if (ready.length === 0) return false;

    logger.info(`🚀 Running ${ready.length} tasks in parallel: ${ready.join(', ')}`);

    // Marca como running
    ready.forEach(task => this.tasks[task].status = 'running');

    // Executa em paralelo
    await Promise.all(
      ready.map(task => this.executeTask(task))
    );

    return true;
  }

  async executeTask(task) {
    try {
      // Executa step1 → step2 → step3 → codeReview → step4 para essa TASK
      await runFullTaskCycle(task);
      this.tasks[task].status = 'completed';
      logger.success(`✅ ${task} completed`);
    } catch (error) {
      this.tasks[task].status = 'failed';
      logger.error(`❌ ${task} failed: ${error.message}`);
    }
  }

  async run() {
    while (await this.executeWave()) {
      // Continua executando ondas até não haver mais TASKs
    }
  }
}

module.exports = { DAGExecutor };
```

#### 1.3. Modificar `cli.js`

```javascript
const { DAGExecutor } = require('./services/dag-executor');

const init = async () => {
  logger.banner();

  // ... setup inicial ...

  // Descobre todas as TASKs e suas dependências
  const taskGraph = buildTaskGraph(); // lê @dependencies de cada TASK.md

  // Executa em paralelo
  const executor = new DAGExecutor(taskGraph);
  await executor.run();

  // Step5: commit final
  await step5(Object.keys(taskGraph), shouldPush);
}

function buildTaskGraph() {
  const tasks = fs.readdirSync(state.claudiomiroFolder)
    .filter(name => fs.statSync(path.join(state.claudiomiroFolder, name)).isDirectory());

  const graph = {};

  for (const task of tasks) {
    const taskMd = fs.readFileSync(path.join(state.claudiomiroFolder, task, 'TASK.md'), 'utf-8');

    // Parse @dependencies do arquivo
    const depsMatch = taskMd.match(/@dependencies\s+\[(.*?)\]/);
    const deps = depsMatch ? depsMatch[1].split(',').map(d => d.trim()).filter(Boolean) : [];

    graph[task] = {
      deps,
      status: fs.existsSync(path.join(state.claudiomiroFolder, task, 'GITHUB_PR.md'))
        ? 'completed'
        : 'pending'
    };
  }

  return graph;
}
```

#### 1.4. Visualização do Progresso

```javascript
// Durante execução:
🚀 Wave 1: Running 3 tasks in parallel: TASK1, TASK2, TASK4
  ⏳ TASK1: Step 2 - Research and planning
  ⏳ TASK2: Step 3 - Implementing tasks
  ⏳ TASK4: Step 1 - Initialization

✅ TASK1 completed
✅ TASK4 completed
⏳ TASK2 still running...

🚀 Wave 2: Running 2 tasks in parallel: TASK3, TASK5
  (TASK3 dependia de TASK1, agora pode rodar)
```

#### 1.5. Otimizações Extras

```javascript
// Limite de concorrência adaptativo baseado em uso de memória/CPU
const os = require('os');
maxConcurrent: Math.max(1, Math.floor(os.cpus().length / 2))  // metade dos cores

// Rate limiting para API do Claude (se necessário)
await rateLimiter.waitIfNeeded();
```

### Benefícios Estimados

- **3 TASKs independentes**: 3x mais rápido
- **10 TASKs com 3 ondas paralelas**: ~3.3x mais rápido
- **Falhas isoladas**: uma TASK falhando não bloqueia outras
- **Melhor utilização de recursos**: múltiplas chamadas Claude simultâneas

---

## 2. Outras Otimizações de Fluxo (PRIORIDADE MÉDIA)

### 2.1. Consolidar Steps
```javascript
// Atual: 3 chamadas ao Claude por TASK
step1: TASK.md → PROMPT.md
step2: PROMPT.md → TODO.md
step3: TODO.md → implementação

// Otimizado: 1 chamada
stepInit: TASK.md → TODO.md diretamente (combina step1 + step2)
stepExecute: implementação
```

**Impacto**: -40% tempo por TASK

### 2.2. Eliminar Code Review Separado
```javascript
// Atual: +1 chamada inteira só para validação
step3 → codeReview → step4

// Otimizado: validação inline no step3
step3: implementa + auto-valida → step4
```

**Impacto**: -20% tempo por TASK

### 2.3. Reduzir Verbosidade dos Prompts
- step0: 195 linhas → pode ser 50 linhas
- Remover repetições de "ULTRA IMPORTANT"
- Instruções mais diretas e objetivas
- Eliminar seções redundantes

**Impacto**: -15% tempo por execução

### 2.4. Batch de TODO Items
```javascript
// Atual: step3 diz "implement one at a time"
// Otimizado: "implement related items together when safe"
```

**Impacto**: -10% tempo no step3

### 2.5. Arquivos Intermediários
```
// Atual: TASK.md → PROMPT.md → TODO.md → CODE_REVIEW.md → GITHUB_PR.md
// Otimizado: TASK.md → TODO.md → GITHUB_PR.md
```

**Impacto**: menos I/O e contexto mais limpo

---

## Impacto Total Combinado

Implementando todas as otimizações:
- Paralelização: **3-5x** (depende do número de TASKs independentes)
- Consolidação de steps: **-40%**
- Eliminar code review: **-20%**
- Prompts concisos: **-15%**
- Batch operations: **-10%**

**Ganho total estimado**: 60-70% mais rápido para projetos sequenciais, até 5x mais rápido para projetos com muitas TASKs paralelas.

---

## Plano de Implementação Sugerido

1. **Fase 1**: Paralelização (maior impacto, mudança arquitetural)
   - Criar `dag-executor.js`
   - Modificar `step0` para adicionar `@dependencies`
   - Atualizar `cli.js` para usar DAG executor

2. **Fase 2**: Consolidação de steps
   - Combinar step1 + step2
   - Integrar validação no step3

3. **Fase 3**: Otimizações menores
   - Reduzir prompts
   - Batch operations
   - Cleanup de arquivos intermediários
