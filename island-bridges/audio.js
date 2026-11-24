/* PLAY ROOM ISLAND BRIDGES audio: shared playback lifecycle, original synthesized marimba-like tones. */
var IslandSound=(()=>{
 const KEY='playroom-island-bridges-audio-v1',defaults={bgm:true,sfx:true,musicVolume:18,sfxVolume:30};let settings={...defaults};
 try{const x=JSON.parse(localStorage.getItem(KEY));if(x){for(const k of ['bgm','sfx'])if(typeof x[k]==='boolean')settings[k]=x[k];for(const k of ['musicVolume','sfxVolume'])if(Number.isFinite(x[k]))settings[k]=Math.max(0,Math.min(100,x[k]));}}catch{}
 const music=new Audio('assets/happy-tropical-loop.mp3');music.loop=true;music.preload='none';let ctx=null,unlocked=false,leaving=false,blocked=false,failed=false,duck=1,duckTimer=null;const voices=new Set();let notify=()=>{};
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
 function audible(){return unlocked&&!leaving&&!document.hidden;}
 function updateVolume(){music.volume=settings.musicVolume/100*duck;}
 function sync(){updateVolume();if(!audible()||!settings.bgm||!settings.musicVolume){music.pause();return;}if(!music.paused)return;try{const p=music.play();if(p?.then)p.then(()=>{blocked=false;failed=false;if(!audible()||!settings.bgm||!settings.musicVolume)music.pause();notify();}).catch(()=>{blocked=true;notify();});}catch{blocked=true;notify();}}
 function unlock(){if(document.hidden||leaving)return;unlocked=true;if(settings.sfx)try{if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(C)ctx=new C();}if(ctx?.state==='suspended')Promise.resolve(ctx.resume()).catch(()=>{});}catch{}sync();notify();}
 function stopVoices(){for(const o of voices)try{o.stop();}catch{}voices.clear();}
 function note(freq,delay,duration,gain){if(!ctx||ctx.state!=='running')return;for(const [multiple,level,decay]of [[1,1,1],[3.99,.12,.4]]){const o=ctx.createOscillator(),g=ctx.createGain(),at=ctx.currentTime+delay;o.type='sine';o.frequency.setValueAtTime(freq*multiple,at);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(gain*level,at+.004);g.gain.exponentialRampToValueAtTime(.0001,at+duration*decay);o.connect(g);g.connect(ctx.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(at);o.stop(at+duration+.02);}}
 function effect(kind){if(!settings.sfx||!settings.sfxVolume||!audible())return;unlock();const gain=settings.sfxVolume/100*.18;if(kind==='clear'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>note(f,i*.13,.45,gain));duck=.35;updateVolume();clearTimeout(duckTimer);duckTimer=setTimeout(()=>{duck=1;sync();},1050);}else if(kind==='match'){note(880,0,.18,gain*.5);note(1174.66,.08,.22,gain*.4);}else note(kind==='select'?660:kind==='one'?523.25:kind==='two'?783.99:360,0,kind==='select'?.07:.14,gain*.7);}

 function set(k,v){if(k==='bgm'||k==='sfx')settings[k]=!!v;else if(k==='musicVolume'||k==='sfxVolume')settings[k]=Math.max(0,Math.min(100,Number(v)||0));else return;if(!settings.sfx)stopVoices();if(k==='bgm'&&settings.bgm&&failed){failed=false;music.load();}persist();unlock();sync();notify();}
 function hide(){leaving=true;music.pause();stopVoices();if(ctx?.state==='running')Promise.resolve(ctx.suspend()).catch(()=>{});}
 function show(){leaving=false;sync();notify();}
 music.addEventListener('error',()=>{failed=true;music.pause();notify();});
 document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')unlock();},{capture:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();else show();});window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
 updateVolume();return {set,effect,get settings(){return {...settings};},get status(){return !settings.bgm||!settings.musicVolume?'off':failed?'failed':blocked?'blocked':!unlocked?'waiting':!audible()?'paused':'ready';},onChange(fn){notify=fn;}};
})();
