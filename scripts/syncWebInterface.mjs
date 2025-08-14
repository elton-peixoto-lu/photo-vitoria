#!/usr/bin/env node

/**
 * Interface Web para Sincronização de Imagens
 * 
 * Cria servidor local com interface web para executar
 * o script de sincronização de imagens.
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SYNC_PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

// Status da sincronização
let syncStatus = {
  running: false,
  progress: [],
  stats: {},
  error: null,
  startTime: null
};

/**
 * Rota principal - Interface web
 */
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sincronização de Imagens - Photo Vitória</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
            padding: 30px;
            text-align: center;
            color: #333;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.8; }
        
        .content { padding: 30px; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #e9ecef;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #495057; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        
        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        button {
            flex: 1;
            min-width: 120px;
            padding: 12px 20px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-start {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }
        .btn-start:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(79,172,254,0.4); }
        .btn-start:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        
        .btn-force {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
        }
        .btn-force:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(250,112,154,0.4); }
        
        .btn-stop {
            background: linear-gradient(135deg, #ff4b1f 0%, #ff9068 100%);
            color: white;
        }
        
        .log-container {
            background: #1e1e1e;
            border-radius: 10px;
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            color: #ffffff;
            margin-bottom: 20px;
        }
        .log-line {
            margin: 2px 0;
            white-space: pre-wrap;
        }
        .log-info { color: #61dafb; }
        .log-success { color: #32d74b; }
        .log-warning { color: #ff9f0a; }
        .log-error { color: #ff453a; }
        .log-progress { color: #5856d6; }
        
        .status-bar {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #28a745;
        }
        .status-dot.running { background: #007bff; animation: pulse 1.5s infinite; }
        .status-dot.error { background: #dc3545; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖼️ Sincronização de Imagens</h1>
            <p>Download e otimização de imagens da API para assets locais</p>
        </div>
        
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" id="totalImages">0</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="downloadedImages">0</div>
                    <div class="stat-label">Baixadas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="skippedImages">0</div>
                    <div class="stat-label">Puladas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="errorImages">0</div>
                    <div class="stat-label">Erros</div>
                </div>
            </div>
            
            <div class="status-bar">
                <div class="status-indicator">
                    <div class="status-dot" id="statusDot"></div>
                    <span id="statusText">Aguardando...</span>
                </div>
                <div id="timeElapsed">00:00</div>
            </div>
            
            <div class="controls">
                <button class="btn-start" onclick="startSync()">🚀 Iniciar Sincronização</button>
                <button class="btn-force" onclick="startSync(true)">🔥 Forçar Re-download</button>
                <button class="btn-stop" onclick="stopSync()">⏹️ Parar</button>
            </div>
            
            <div class="log-container" id="logContainer">
                <div class="log-line">💡 Pronto para sincronizar imagens...</div>
                <div class="log-line">📁 Pastas: casamentos, infantil, femininos, pre-weding, noivas</div>
                <div class="log-line">⚙️ Clique em "Iniciar Sincronização" para começar</div>
            </div>
        </div>
        
        <div class="footer">
            <p>🖼️ Photo Vitória - Sistema de Sincronização de Assets</p>
        </div>
    </div>

    <script>
        let eventSource = null;
        let startTime = null;
        
        function addLog(message, type = 'info') {
            const logContainer = document.getElementById('logContainer');
            const logLine = document.createElement('div');
            logLine.className = \`log-line log-\${type}\`;
            logLine.textContent = new Date().toLocaleTimeString() + ' ' + message;
            logContainer.appendChild(logLine);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        function updateStats(stats) {
            if (stats.totalImages !== undefined) 
                document.getElementById('totalImages').textContent = stats.totalImages;
            if (stats.downloadedImages !== undefined) 
                document.getElementById('downloadedImages').textContent = stats.downloadedImages;
            if (stats.skippedImages !== undefined) 
                document.getElementById('skippedImages').textContent = stats.skippedImages;
            if (stats.errorImages !== undefined) 
                document.getElementById('errorImages').textContent = stats.errorImages;
        }
        
        function updateStatus(running, text = null) {
            const statusDot = document.getElementById('statusDot');
            const statusText = document.getElementById('statusText');
            
            statusDot.className = 'status-dot';
            if (running) {
                statusDot.classList.add('running');
                statusText.textContent = text || 'Sincronizando...';
            } else {
                statusText.textContent = text || 'Aguardando...';
            }
        }
        
        function updateTimeElapsed() {
            if (!startTime) return;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timeElapsed').textContent = 
                \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }
        
        setInterval(updateTimeElapsed, 1000);
        
        function startSync(force = false) {
            if (eventSource) {
                addLog('Sincronização já em andamento...', 'warning');
                return;
            }
            
            startTime = Date.now();
            updateStatus(true);
            addLog(\`Iniciando sincronização\${force ? ' (modo força)' : ''}...\`, 'info');
            
            // Inicia SSE
            eventSource = new EventSource(\`/sync/start\${force ? '?force=true' : ''}\`);
            
            eventSource.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                if (data.type === 'log') {
                    addLog(data.message, data.level || 'info');
                } else if (data.type === 'stats') {
                    updateStats(data.stats);
                } else if (data.type === 'complete') {
                    addLog('🎉 Sincronização concluída!', 'success');
                    updateStatus(false, 'Concluída');
                    eventSource.close();
                    eventSource = null;
                } else if (data.type === 'error') {
                    addLog(\`Erro: \${data.message}\`, 'error');
                    updateStatus(false, 'Erro');
                    eventSource.close();
                    eventSource = null;
                }
            };
            
            eventSource.onerror = function() {
                addLog('Conexão perdida com o servidor', 'error');
                updateStatus(false, 'Erro de conexão');
                eventSource.close();
                eventSource = null;
            };
        }
        
        function stopSync() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                addLog('Sincronização interrompida pelo usuário', 'warning');
                updateStatus(false, 'Interrompida');
            }
        }
        
        // Carrega status inicial
        fetch('/sync/status')
            .then(r => r.json())
            .then(status => {
                if (status.running) {
                    updateStatus(true);
                    updateStats(status.stats);
                }
            });
    </script>
</body>
</html>
  `);
});

/**
 * API - Status da sincronização
 */
app.get('/sync/status', (req, res) => {
  res.json(syncStatus);
});

/**
 * API - Iniciar sincronização (Server-Sent Events)
 */
app.get('/sync/start', (req, res) => {
  if (syncStatus.running) {
    res.status(400).json({ error: 'Sincronização já em andamento' });
    return;
  }
  
  // Configura SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Reset status
  syncStatus = {
    running: true,
    progress: [],
    stats: { totalImages: 0, downloadedImages: 0, skippedImages: 0, errorImages: 0 },
    error: null,
    startTime: Date.now()
  };
  
  const force = req.query.force === 'true';
  const args = [path.join(__dirname, 'syncImages.mjs')];
  if (force) args.push('--force');
  
  // Inicia processo de sincronização
  const syncProcess = spawn('node', args, {
    cwd: path.dirname(__dirname)
  });
  
  // Envia log para cliente
  function sendEvent(type, data) {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  }
  
  // Processa output do script
  syncProcess.stdout.on('data', (data) => {
    const output = data.toString();
    const lines = output.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Remove códigos ANSI
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
      
      if (cleanLine.includes('✅') || cleanLine.includes('success')) {
        sendEvent('log', { message: cleanLine, level: 'success' });
      } else if (cleanLine.includes('❌') || cleanLine.includes('error')) {
        sendEvent('log', { message: cleanLine, level: 'error' });
      } else if (cleanLine.includes('⚠️') || cleanLine.includes('warning')) {
        sendEvent('log', { message: cleanLine, level: 'warning' });
      } else if (cleanLine.includes('🔄') || cleanLine.includes('progress')) {
        sendEvent('log', { message: cleanLine, level: 'progress' });
      } else if (cleanLine.trim()) {
        sendEvent('log', { message: cleanLine, level: 'info' });
      }
      
      // Extrai estatísticas do log
      if (cleanLine.includes('Total de imagens processadas:')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) syncStatus.stats.totalImages = parseInt(match[1]);
      } else if (cleanLine.includes('Baixadas/processadas:')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) syncStatus.stats.downloadedImages = parseInt(match[1]);
      } else if (cleanLine.includes('Já existiam (puladas):')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) syncStatus.stats.skippedImages = parseInt(match[1]);
      } else if (cleanLine.includes('Erros:')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) syncStatus.stats.errorImages = parseInt(match[1]);
      }
      
      sendEvent('stats', { stats: syncStatus.stats });
    });
  });
  
  syncProcess.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    sendEvent('log', { message: errorMsg, level: 'error' });
    syncStatus.error = errorMsg;
  });
  
  syncProcess.on('close', (code) => {
    syncStatus.running = false;
    
    if (code === 0) {
      sendEvent('complete', { stats: syncStatus.stats });
    } else {
      sendEvent('error', { message: \`Processo finalizado com código \${code}\` });
    }
    
    res.end();
  });
  
  // Handle client disconnect
  req.on('close', () => {
    if (syncProcess && !syncProcess.killed) {
      syncProcess.kill();
    }
    syncStatus.running = false;
  });
});

/**
 * Inicia servidor
 */
app.listen(PORT, () => {
  console.log(\`
🌐 Interface Web de Sincronização iniciada!
📍 Acesse: http://localhost:\${PORT}
🔧 Porta: \${PORT}
  \`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n👋 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n👋 Encerrando servidor...');
  process.exit(0);
});
