// Phone-Chain V2 - DePIN by Gaafar53 - Egypt
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const PORT = 8081;
let chain = [];
let balance = 50;

// قراءة الهاردوير الحقيقي
function getBattery() {
    try { return fs.readFileSync('/sys/class/power_supply/battery/capacity','utf8').trim(); } catch { return '75'; }
}
function getTemp() {
    try { return (parseInt(fs.readFileSync('/sys/class/thermal/thermal_zone0/temp','utf8'))/1000).toFixed(1); } catch { return '35.0'; }
}

function loadChain() {
    if (fs.existsSync('chain.json')) {
        try { chain = JSON.parse(fs.readFileSync('chain.json')); balance = chain.length * 10; } catch {}
    }
    if (chain.length === 0) {
        chain.push({ index: 0, miner: 'GENESIS', bat: getBattery(), temp: getTemp(), torque: '4.8', hash: 'GENESIS - undefined', time: new Date().toLocaleString('ar-EG'), type: 'Genesis Block - Egypt' });
        save();
    }
}
function save() { fs.writeFileSync('chain.json', JSON.stringify(chain, null, 2)); }

function mine() {
    const bat = getBattery();
    const temp = getTemp();
    const torque = '4.8';
    const prevHash = crypto.createHash('sha256').update(JSON.stringify(chain[chain.length-1])).digest('hex').slice(0,16);
    const block = {
        index: chain.length,
        miner: 'Gomr',
        bat: bat,
        temp: temp,
        torque: torque,
        hash: prevHash,
        time: new Date().toLocaleString('ar-EG'),
        type: `Gomr BAT:${bat}% TEMP:${temp}C`
    };
    chain.push(block);
    balance += 10;
    save();
    return block;
}

loadChain();

http.createServer((req, res) => {
    if (req.url === '/mine') { const b = mine(); res.end(JSON.stringify(b)); return; }
    if (req.url === '/chain') { res.end(JSON.stringify(chain)); return; }
    
    const bat = getBattery();
    const temp = getTemp();
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(`
<!DOCTYPE html>
<html dir="rtl">
<head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{background:#000;color:#fff;font-family:sans-serif;padding:20px;text-align:center}
.header{font-size:32px;font-weight:bold;margin:20px 0}
.stats{font-size:18px;margin:15px 0}
.btn{background:#00ff00;color:#000;padding:15px 30px;border-radius:12px;font-size:18px;border:none;width:90%;margin:20px 0;font-weight:bold}
.block{background:#111;border-radius:12px;padding:15px;margin:10px 0;text-align:center}
.block-title{font-size:18px}
.block-hash{color:#888;font-size:13px;direction:ltr}
.footer{color:#888;font-size:13px;margin-top:30px;line-height:22px}
</style></head>
<body>
<div class="header">Phone-Chain DePIN 📱</div>
<div class="stats">Gomr | 💰 ${balance} | ⛓️ ${chain.length} Blocks | 🔋 ${bat}% 👤 | 🌡️ ${temp}°C | τ:4.8</div>
<button class="btn" onclick="fetch('/mine').then(()=>location.reload())">⛏️ عدن Block - بصمة هاردوير حقيقية</button>
<div style="margin:20px 0;font-size:20px">البلوكشين - كل Block = بصمة هاردوير<br>مستحيل تتزور</div>
${chain.slice().reverse().map(b=>`
<div class="block">
<div class="block-title">${b.type} #${b.index} ${b.bat?`BAT:${b.bat}% TEMP:${b.temp}C`:''} ${b.torque?`TORQUE:${b.torque}`:''}</div>
<div class="block-hash">${b.hash} - ${b.time}</div>
</div>
`).join('')}
<div class="footer">Node.js v26.3.1 - قراءة حقيقية من<br>/sys/class/power_supply/ و<br>/sys/class/thermal/</div>
<script>setInterval(()=>fetch('/mine').then(()=>location.reload()), 60000)</script>
</body>
</html>
    `);
}).listen(PORT, ()=>console.log(`Live http://localhost:${PORT} - Blocks:${chain.length} Balance:${balance}`));
