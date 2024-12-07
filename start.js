const { spawn } = require('child_process');
const readline = require('readline')
const path = require('path');
const Logger = require('./utils/logger');

let appProcess = undefined;

Logger.log('正在開始執行由 Jimmy 開發的 [廢土鐵原礦機器人]');

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout   
});

rl.on('line', async function (line) {
    if (appProcess != undefined) appProcess.stdin.write(line + '\n');
});

function startApp() {
    appProcess = spawn('node', [path.join(__dirname, 'main.js')]);

    appProcess.stdout.on('data', (data) => {
        console.log(String(data).replace(/\n$/, ''));
    });

    appProcess.stderr.on('data', (data) => {
        Logger.error(`發現以下錯誤 ${data}`);
    });

    appProcess.on('close', (code) => {
        if (code == 135) {
            Logger.log(`機器人已關閉`)
            process.kill()
        } else if (code == 246) {
            Logger.log(`機器人正在重新啟動中...`)
        } else {
            Logger.error(`程式回傳錯誤碼 ${code} ，正在重新啟動中...`);
        }
        appProcess = undefined
        startApp();
    });
}

startApp();