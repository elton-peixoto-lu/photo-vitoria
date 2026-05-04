import https from 'https';
import dns from 'dns/promises';

const productionHost = process.env.SMOKE_HOST || 'estudiovitoriafreitas.com.br';
const expectedIp = process.env.SMOKE_EXPECTED_IP || '34.36.28.108';
const adminPath = process.env.SMOKE_ADMIN_PATH || '/admin/galeria';

function headRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve({
        statusCode: res.statusCode || 0,
        headers: res.headers,
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const errors = [];

  const answers = await dns.resolve4(productionHost);
  if (!answers.includes(expectedIp)) {
    errors.push(`DNS de ${productionHost} nao aponta para ${expectedIp}. Atual: ${answers.join(', ')}`);
  }

  const rootResponse = await headRequest(`https://${productionHost}/`);
  if (![200, 301, 302, 307, 308].includes(rootResponse.statusCode)) {
    errors.push(`Resposta inesperada na raiz: HTTP ${rootResponse.statusCode}`);
  }

  const adminResponse = await headRequest(`https://${productionHost}${adminPath}`);
  if (![200, 301, 302, 307, 308].includes(adminResponse.statusCode)) {
    errors.push(`Resposta inesperada no admin: HTTP ${adminResponse.statusCode}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`SMOKE FAIL: ${error}`);
    }
    process.exit(1);
  }

  console.log(`SMOKE OK: ${productionHost} responde no IP ${expectedIp}`);
  console.log(`SMOKE OK: raiz HTTP ${rootResponse.statusCode}`);
  console.log(`SMOKE OK: admin HTTP ${adminResponse.statusCode}`);
}

main().catch((error) => {
  console.error(`SMOKE FAIL: ${error.message}`);
  process.exit(1);
});
