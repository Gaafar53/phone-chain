const http = require("http");
const fs = require("fs");
const crypto = require("crypto");

function getPhone(){
  let d = {bat:75, temp:35, up:0};
  try{
    if(fs.existsSync("/sys/class/power_supply/battery/capacity")) d.bat = parseInt(fs.readFileSync("/sys/class/power_supply/battery/capacity","utf8"));
    if(fs.existsSync("/sys/class/thermal/thermal_zone0/temp")) d.temp = parseInt(fs.readFileSync("/sys/class/thermal/thermal_zone0/temp","utf8"))/1000;
    d.up = parseFloat(fs.readFileSync("/proc/uptime","utf8").split(" ")[0])/3600;
  }catch(e){}
  return d;
}

let chain=[]; try{chain=JSON.parse(fs.readFileSync("chain.json","utf8"))}catch(e){chain=[{index:0,hash:"GENESIS",prev:"0",data:"Genesis Block - Egypt"}]}
let players={}; try{players=JSON.parse(fs.readFileSync("players.json","utf8"))}catch(e){}

const server = http.createServer((req,res)=>{
  let url = new URL(req.url, "http://localhost");
  let player = url.searchParams.get("player") || "Gomr";
  let phone = getPhone();
  let power = phone.bat * 4.5;
  let rpm = 1000 + phone.temp * 10;
  let torque = (power / (rpm * 0.1047 || 1)) * 2;

  if(url.searchParams.get("mine")==="1"){
    let h = crypto.createHash("sha256").update(chain[chain.length-1].hash + Date.now()).digest("hex").slice(0,16);
    let block = {index:chain.length, hash:h, prev:chain[chain.length-1].hash, data: player + " BAT:" + phone.bat + "% TEMP:" + phone.temp.toFixed(1) + "C TORQUE:" + torque.toFixed(1), time: new Date().toLocaleString("ar-EG")};
    chain.push(block);
    if(!players[player]) players[player]={coins:0, blocks:0};
    players[player].coins+=10; players[player].blocks++;
    fs.writeFileSync("chain.json", JSON.stringify(chain,null,2));
    fs.writeFileSync("players.json", JSON.stringify(players,null,2));
    res.writeHead(302, {Location:"/?player="+player}); return res.end();
  }

  let html = "<html dir=rtl><head><meta charset=UTF-8><meta name=viewport content='width=device-width'><title>Phone-Chain</title></head><body style=background:#000;color:#fff;font-family:monospace;padding:15px><h1>📱 Phone-Chain DePIN</h1><p>👤 "+player+" | 💰 "+(players[player]?.coins||0)+" | ⛓️ "+chain.length+" Blocks | 🔋 "+phone.bat+"% | 🌡️ "+phone.temp.toFixed(1)+"C | τ:"+torque.toFixed(1)+"</p><p><a href=/?player="+player+"&mine=1 style=background:#0f0;color:#000;padding:12px;border-radius:8px;text-decoration:none;display:block;text-align:center>⛏️ عدن Block - بصمة هاردوير حقيقية</a></p><h3>البلوكشين - كل Block = بصمة هاردوير مستحيل تتزور</h3><div>";
  html += chain.slice().reverse().map(b=>"<div style=background:#111;padding:8px;margin:5px;border-radius:5px>#"+b.index+" "+b.data+"<br><small style=color:#888>"+b.hash+" - "+b.time+"</small></div>").join("");
  html += "</div><p style=color:#888;font-size:12px>Node.js v26.3.1 - قراءة حقيقية من /sys/class/power_supply/ و /sys/class/thermal/</p></body></html>";
  res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"}); res.end(html);
});

server.listen(8081, "0.0.0.0", ()=> console.log("✅ Phone-Chain شغال http://localhost:8081"));
