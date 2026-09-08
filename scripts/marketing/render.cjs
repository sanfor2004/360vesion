const { chromium } = require('../../temp/marketing-tools/node_modules/playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const sharp = require('sharp');
const ffmpeg = require('../../temp/marketing-tools/node_modules/ffmpeg-static');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'public/markting');
const scratch = path.join(root, 'temp/marketing');
function encode(args) { const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw new Error(r.stderr); }
function gifs(){
 for(const [input,start,duration,name,width] of [['360vision-wide.mp4','5','15','studio-overview',720],['tour-walkthrough.mp4','0','10','tour-navigation',560]]){
  encode(['-ss',start,'-t',duration,'-i',path.join(out,'video',input),'-filter_complex',`fps=8,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,'-loop','0',path.join(out,'gifs',name+'.gif')]);
 }
}
async function main(){
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(__dirname,'stage.html')).href);
 await page.evaluate(()=>document.fonts.ready);
 const cards=[['hero','wide',1920,1080,'hero'],['hero','wide',1200,627,'linkedin-landscape'],['hero','square',1080,1080,'facebook-square'],['hero','wide',1600,900,'blog-cover'],['lifestyle','wide',1920,1080,'lifestyle'],['product','wide',1920,1080,'product-studio']];
 for(const [index,key] of ['explore','map','studio','mobile'].entries()){
  cards.push([key,'portrait',1080,1920,`aso-${index+1}-${key}`]);
  cards.push([key,'portrait',1080,1350,`carousel-${index+1}-${key}`]);
 }
 for(const [key,format,width,height,name] of cards){
  await page.setViewportSize({width,height});await page.evaluate(({key,format})=>window.setCard(key,format),{key,format});
  await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.src).map(i=>i.decode().catch(()=>{}))));
  await page.screenshot({path:path.join(out,'images',name+'.png')});console.log('Exported',name);
 }
 // Lightweight derivative for documentation and blog embedding.
 await sharp(path.join(out,'images/hero.png')).resize(1440).webp({quality:85}).toFile(path.join(out,'images/hero.webp'));
 if(process.argv.includes('--stills-only'))return;
 for(const format of ['wide','portrait']){
  await page.setViewportSize(format==='wide'?{width:1920,height:1080}:{width:1080,height:1920});
  const dir=path.join(scratch,'frames-'+format);await fs.mkdir(dir,{recursive:true});
  for(let i=0;i<720;i++){
   await page.evaluate(async({t,format})=>window.renderFrame(t,format),{t:i/24,format});
   await page.screenshot({path:path.join(dir,String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:91});
   if(i%120===0)console.log(format,'frame',i,'/ 720');
  }
  encode(['-framerate','24','-i',path.join(dir,'%04d.jpg'),'-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'video',`360vision-${format}.mp4`)]);
  console.log('Encoded',format);
 }
 encode(['-framerate','24','-i',path.join(scratch,'tour-frames/%04d.jpg'),'-c:v','libx264','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'video/tour-walkthrough.mp4')]);
 gifs();
 } finally {await browser.close();}
}
if(process.argv.includes('--gifs-only'))gifs();else main().catch(e=>{console.error(e);process.exit(1)});
