(()=>{'use strict';
 const $=id=>document.getElementById(id),base=new URL('./',location.href),workerURL=new URL('precision-worker.js',base),params=new URL(location.href).searchParams;
 let measured=null,ready=false,running=false,start=0,lastInput=-Infinity,attempts=[],lastDigitCount=0,installing=false;
 const isolated=()=>window.crossOriginIsolated===true;
 async function sample(){
  const steps=[];let calls=0;
  for(let batch=0;batch<32;batch++){
   let prev=performance.now();
   for(let i=0;i<512;i++){const next=performance.now(),delta=next-prev;if(Number.isFinite(delta)&&delta>0)steps.push(delta);prev=next;calls++;}
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  steps.sort((a,b)=>a-b);
  return {calls,positive:steps.length,stepMs:steps.length>=4?steps[Math.floor(steps.length*.1)]:null};
 }
 function diagnostic(){return JSON.stringify({test:'limit-break-precision-v0.1',secure:window.isSecureContext===true,isolated:isolated(),controlled:!!navigator.serviceWorker?.controller,controller:navigator.serviceWorker?.controller?.scriptURL||null,clock:measured,results:attempts,nonzeroFourthDigits:lastDigitCount,userAgent:navigator.userAgent},null,2);}
 function paint(){
  $('isolation').textContent=isolated()?'有効':'未有効';
  $('step').textContent=measured?.stepMs!==null&&measured?.stepMs!==undefined?(measured.stepMs*1000).toFixed(2)+' μs':'判別できませんでした';
  $('support').textContent=ready?'時計の細かい変化を確認':'まだ確認できていません';
  $('enable').disabled=installing||isolated()||ready;
  $('action').disabled=!ready;
  $('resample').disabled=running||installing;
  $('diagnostic').textContent=diagnostic();
 }
 async function inspect(){
  if(running||installing)return;
  $('state').textContent='時計を確認しています…';$('action').disabled=true;$('resample').disabled=true;
  measured=await sample();ready=measured.stepMs!==null&&measured.stepMs<=.105;
  if(ready){$('state').textContent='4桁表示に必要な時計の刻みを確認しました';$('notice').textContent='START → 約1秒後にSTOP。数回お試しください。';}
  else if(params.has('precision')){$('state').textContent='この方法では、まだ4桁計測を確認できません';$('notice').textContent='この画面のスクリーンショットをお送りください。';}
  else {$('state').textContent='次に、高精度計測を有効にしてください';$('notice').textContent='設定前は計測を開始しません。';}
  paint();
 }
 $('enable').addEventListener('click',async()=>{
  if(installing||isolated()||ready)return;
  if(base.pathname!=='/limit-break-precision-test/'){$('state').textContent='limit-break-precision-testフォルダに配置してください';return;}
  if(!window.isSecureContext||!navigator.serviceWorker){$('state').textContent='HTTPSの公開URLをSafariで開いてください';return;}
  installing=true;paint();$('state').textContent='設定しています。完了後、一度だけ読み直します…';
  let reloaded=false;
  const reload=()=>{
   const c=navigator.serviceWorker.controller;
   if(reloaded||!c||new URL(c.scriptURL).pathname!==workerURL.pathname)return;
   reloaded=true;const target=new URL(location.href);target.searchParams.set('precision','1');target.searchParams.set('v','0.1');location.replace(target.href);
  };
  navigator.serviceWorker.addEventListener('controllerchange',reload);
  try{
   const registration=await navigator.serviceWorker.register(workerURL.href,{scope:base.pathname,updateViaCache:'none'});
   if(registration.scope!==base.href)throw Error('Unexpected worker scope');
   reload();
   setTimeout(()=>{if(!reloaded){installing=false;paint();$('state').textContent='設定に時間がかかっています。もう一度押すか、画面をお送りください。';}},10000);
  }catch(e){installing=false;paint();$('state').textContent='設定できませんでした：'+e.message;}
 });
 function act(){
  const now=performance.now();if(!ready||document.hidden||now-lastInput<100)return;lastInput=now;
  if(!running){start=now;running=true;$('clock').textContent='—.————';$('action').textContent='STOP';$('notice').textContent='自分の1秒で止めてください。';}
  else {running=false;const seconds=(now-start)/1000,text=seconds.toFixed(4);$('clock').textContent=text;$('action').textContent='START';attempts.push({seconds,display:text});if(text.slice(-1)!=='0')lastDigitCount++;$('lastDigit').textContent='4桁目が0以外になった結果：'+lastDigitCount+'回';const li=document.createElement('li');li.textContent=text+' 秒';$('results').prepend(li);$('notice').textContent='もう一度お試しください。';}
  paint();
 }
 $('action').addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;e.preventDefault();act();});
 $('action').addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)&&!e.repeat){e.preventDefault();act();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&running){running=false;$('action').textContent='START';$('clock').textContent='0.0000';$('notice').textContent='計測を中断しました。';paint();}});
 $('resample').addEventListener('click',inspect);
 $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(diagnostic());$('notice').textContent='確認結果をコピーしました。';}catch{$('notice').textContent='コピーできません。画面のスクリーンショットをお送りください。';}});
 inspect();
})();
