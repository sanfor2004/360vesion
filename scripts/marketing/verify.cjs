const fs=require('node:fs/promises');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require('../../temp/marketing-tools/node_modules/playwright');
const sharp=require('sharp');
const ffmpeg=require('../../temp/marketing-tools/node_modules/ffmpeg-static');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'public/markting');
const scratch=path.join(root,'temp/marketing');
async function main(){
 const results={images:[],media:[],gallery:[]};
 for(const name of await fs.readdir(path.join(out,'images'))){
  const file=path.join(out,'images',name);const m=await sharp(file).metadata();
  results.images.push({name,width:m.width,height:m.height,bytes:(await fs.stat(file)).size});
 }
 for(const folder of ['video','gifs'])for(const name of await fs.readdir(path.join(out,folder))){
  const file=path.join(out,folder,name);const decoded=spawnSync(ffmpeg,['-hide_banner','-v','error','-i',file,'-f','null','-'],{encoding:'utf8'});
  if(decoded.status!==0)throw new Error(name+': '+decoded.stderr);
  const metadata=spawnSync(ffmpeg,['-hide_banner','-i',file],{encoding:'utf8'}).stderr;
  results.media.push({name,bytes:(await fs.stat(file)).size,decode:'passed',metadata});
 }
 for(const format of ['wide','portrait'])for(let n=0;n<6;n++){
  const r=spawnSync(ffmpeg,['-hide_banner','-v','error','-y','-ss',String(n*5+2.5),'-i',path.join(out,'video',`360vision-${format}.mp4`),'-frames:v','1',path.join(scratch,`review-${format}-${n}.png`)],{encoding:'utf8'});
  if(r.status!==0)throw new Error(r.stderr);
 }
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [width,height] of [[1440,1000],[390,844]]){
   await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:3010/markting/index.html');
   await page.locator('#cards article').last().waitFor();
   const broken=await page.evaluate(async()=>{const urls=[...document.querySelectorAll('a[href],img[src],source[src]')].map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(u=>u&&!u.startsWith('https:'));const bad=[];for(const u of new Set(urls)){const r=await fetch(u,{method:'HEAD'});if(!r.ok)bad.push({url:u,status:r.status});}return bad;});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(broken.length||overflow)throw new Error(JSON.stringify({broken,overflow}));
   await page.screenshot({path:path.join(scratch,`gallery-${width}.png`),fullPage:true});
   await page.screenshot({path:path.join(scratch,`gallery-top-${width}.png`)});
   const video=page.locator('video').first();await video.evaluate(v=>{v.currentTime=7.5;});
   await page.waitForTimeout(500);
   const playback=await video.evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,ready:v.readyState}));
   if(playback.duration!==30||playback.ready<2)throw new Error('Video metadata/playback failed');
   const portrait=page.locator('video').nth(1);
   await portrait.evaluate(v=>{v.currentTime=17.5;});await page.waitForTimeout(500);
   const verticalPlayback=await portrait.evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,ready:v.readyState}));
   if(verticalPlayback.duration!==30||verticalPlayback.width!==1080||verticalPlayback.height!==1920||verticalPlayback.ready<2)throw new Error('Vertical video playback failed');
   results.gallery.push({width,height,brokenLinks:broken,overflow,playback,verticalPlayback});
  }
  if(errors.length)throw new Error(errors.join('\n'));
 }finally{await browser.close();}
 await fs.writeFile(path.join(scratch,'export-validation.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({images:results.images.length,media:results.media.map(x=>({name:x.name,MB:(x.bytes/1048576).toFixed(2),decode:x.decode})),gallery:results.gallery},null,2));
}
main().catch(e=>{console.error(e);process.exit(1)});
