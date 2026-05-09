const [repo, sha] = process.argv.slice(2);
const token = process.env.GH_TOKEN;

if (!repo || !sha || !token) {
  console.error('Uso: node scripts/waitForWorkerDeploy.mjs <repo> <sha>');
  process.exit(1);
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'User-Agent': 'codex',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= 60; attempt += 1) {
  const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=50`, { headers });
  if (!response.ok) {
    console.error(`Falha ao consultar runs do GitHub: ${response.status}`);
    process.exit(1);
  }

  const payload = await response.json();
  const runs = payload.workflow_runs || [];
  const sameSha = runs.filter((run) => run.head_sha === sha && run.name === 'Deploy Image Worker to Cloud Run');

  if (sameSha.length > 0) {
    const run = sameSha[0];
    console.log(`worker deploy run ${run.id} -> ${run.status}/${run.conclusion}`);
    if (run.status === 'completed' && run.conclusion === 'success') process.exit(0);
    if (run.status === 'completed' && run.conclusion !== 'success') {
      console.error(`worker deploy failed: ${run.conclusion}`);
      process.exit(1);
    }
  } else {
    const fallback = runs.find(
      (run) => run.name === 'Deploy Image Worker to Cloud Run' && run.status === 'completed' && run.conclusion === 'success',
    );
    if (fallback) {
      console.log(`usando ultimo deploy de worker bem-sucedido ${fallback.id} para disparar o reprocess`);
      process.exit(0);
    }
    console.log('worker deploy run ainda nao apareceu');
  }

  await sleep(10000);
}

console.error('timeout aguardando deploy do worker');
process.exit(1);
