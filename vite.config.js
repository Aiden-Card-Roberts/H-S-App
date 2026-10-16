import {defineConfig} from 'vite';
let publicBase='/';
export default defineConfig({plugins:[{
  name:'offline-cache',
  configResolved(config){publicBase=config.base;},
  generateBundle(_,bundle){
    const base=publicBase;
    const assets=[...new Set([base,`${base}index.html`,`${base}manifest.webmanifest`,`${base}icon.svg`,...Object.keys(bundle).map(file=>`${base}${file}`)])];
    const prefix=`fieldcheck-${base}-`;
    const version=Object.keys(bundle).join('|');
    this.emitFile({type:'asset',fileName:'sw.js',source:`const CACHE=${JSON.stringify(prefix+version)};const PREFIX=${JSON.stringify(prefix)};const ASSETS=${JSON.stringify(assets)};const FALLBACK=${JSON.stringify(base+'index.html')};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||(new URL(event.request.url).origin!==self.location.origin||new URL(event.request.url).pathname.includes('/api/')))return;event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request,{ignoreVary:true});if(cached)return cached;try{return await fetch(event.request);}catch{return event.request.mode==='navigate'?(await cache.match(FALLBACK)):Response.error();}}));});`});
  }
}]});
