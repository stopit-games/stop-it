'use strict';
// Network-only worker. Its default scope is this test folder, not the site root.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const scope=new URL(self.registration.scope),url=new URL(event.request.url);
 if(event.request.mode!=='navigate'||url.origin!==scope.origin||!['', 'index.html'].includes(url.pathname.slice(scope.pathname.length))||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  const response=await fetch(event.request,{cache:'no-store'});
  if(response.type==='opaque'||!response.ok)return response;
  const headers=new Headers(response.headers);
  headers.set('Cross-Origin-Opener-Policy','same-origin');
  headers.set('Cross-Origin-Embedder-Policy','require-corp');
  headers.set('Cross-Origin-Resource-Policy','same-origin');
  headers.set('Cache-Control','no-store');
  headers.delete('Content-Length');headers.delete('Content-Encoding');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 })());
});
