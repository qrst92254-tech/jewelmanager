const fs = require('fs');
const { execSync } = require('child_process');

// Install sharp if not present
try { require('sharp'); } catch(e) { execSync('npm install sharp --save-dev', {stdio:'inherit'}); }

const sharp = require('sharp');
if (!fs.existsSync('public/icons')) fs.mkdirSync('public/icons', {recursive:true});

const svg192 = fs.readFileSync('public/icon-192.svg');
const svg512 = fs.readFileSync('public/icon-512.svg');

sharp(svg192).resize(192,192).png().toFile('public/icons/icon-192.png', (e) => { if(e) console.error(e); else console.log('icon-192.png done'); });
sharp(svg512).resize(512,512).png().toFile('public/icons/icon-512.png', (e) => { if(e) console.error(e); else console.log('icon-512.png done'); });
