const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=process.argv[2]||path.resolve(__dirname,'../UPLOAD/limit-break-precision-test');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8'),sw=fs.readFileSync(path.join(root,'precision-worker.js'),'utf8');
async function ui(step){
 const dom=new JSDOM(html,{url:'https://stopit-game.com/limit-break-precision-test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let clock=0;
 Object.defineProperty(w.performance,'now',{value:()=>clock+=step});Object.defineProperty(w,'isSecureContext',{value:true});Object.defineProperty(w,'crossOriginIsolated',{value:false});
 Object.defineProperty(w.navigator,'serviceWorker',{value:{controller:null,register:()=>Promise.reject(Error('denied')),addEventListener(){}}});
 w.eval(app);for(let i=0;i<100&&w.document.getElementById('support').textContent==='確認中';i++)await new Promise(r=>setTimeout(r,10));
 return {w,dom,el:id=>w.document.getElementById(id),add:n=>clock+=n};
}
(async()=>{
 let f=await ui(1);assert(f.el('action').disabled);assert.match(f.el('state').textContent,/有効に/);f.el('enable').click();await new Promise(r=>setTimeout(r,10));assert.match(f.el('state').textContent,/設定できません/);f.w.close();
 f=await ui(.02);assert(!f.el('action').disabled);assert.match(f.el('support').textContent,/確認/);
 const press=()=>{const e=new f.w.MouseEvent('pointerdown',{button:0,bubbles:true,cancelable:true});Object.defineProperty(e,'isPrimary',{value:true});f.el('action').dispatchEvent(e);};
 press();f.add(1000.16);press();assert.equal(f.el('clock').textContent,'1.0002');assert.match(f.el('lastDigit').textContent,/1回/);assert.equal(f.el('results').children.length,1);f.w.close();
 const listeners={},scope='https://stopit-game.com/limit-break-precision-test/';
 const sandbox={URL,Headers,Response,fetch:async()=>new Response('ok',{headers:{'content-type':'text/html','content-length':'2','content-encoding':'gzip'}}),self:{registration:{scope},skipWaiting:async()=>{},clients:{claim:async()=>{}},addEventListener:(k,v)=>listeners[k]=v}};
 vm.runInNewContext(sw,sandbox);
 let response;listeners.fetch({request:{mode:'navigate',url:scope+'index.html'},respondWith:p=>response=p});const res=await response;
 assert.equal(res.headers.get('Cross-Origin-Opener-Policy'),'same-origin');assert.equal(res.headers.get('Cross-Origin-Embedder-Policy'),'require-corp');assert.equal(res.headers.get('Cache-Control'),'no-store');assert.equal(res.headers.get('content-encoding'),null);assert.equal(await res.text(),'ok');
 for(const url of [scope+'reset.html','https://stopit-game.com/limit-break/','https://stopit-game.com/games/','https://example.org/limit-break-precision-test/index.html']){let handled=false;listeners.fetch({request:{mode:'navigate',url},respondWith(){handled=true}});assert.equal(handled,false);}
 assert(!sw.includes('caches.'));assert(!app.includes('localStorage'));assert(!app.includes('sessionStorage'));assert(!app.includes('fetch('));
 console.log('PASS: coarse-clock guard, fine-clock fourth digit, registration failure, required response headers, no cache, test-folder-only scope, reset escape route, no game-record changes.');
})().catch(e=>{console.error(e);process.exitCode=1});
