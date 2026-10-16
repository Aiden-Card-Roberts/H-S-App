import {api,account} from './accounts.js';
function clean(audit){return Object.fromEntries(Object.entries(audit).filter(([key])=>!key.startsWith('_')));}
export async function syncCompanyAudits(local,{onProgress=async()=>{}}={}){
 const {audits:remote}=await api('/audits');const records=new Map(remote.map(a=>[a.id,a]));let conflicts=0;for(const audit of local)if(audit._dirty)records.set(audit.id,audit);
 for(const audit of local){if(!audit._dirty)continue;
  try{const result=await api('/audits/'+audit.id,{method:'PUT',body:JSON.stringify({audit:clean(audit),version:audit._version||0})});records.set(audit.id,{...audit,_version:result.version,_author:result.author,_dirty:false});}
  catch(error){if(error.code!=='version_conflict')throw error;const latest=(await api('/audits')).audits.find(a=>a.id===audit.id);if(latest)records.set(audit.id,latest);const copy={...clean(audit),id:crypto.randomUUID(),site:`${audit.site||'Untitled site'} (conflict copy)`,status:'draft'};delete copy.completedAt;if(account.user?.role!=='owner')Object.assign(copy,{unsafeActivity:'no',managerName:'',managerComments:''});const result=await api('/audits/'+copy.id,{method:'PUT',body:JSON.stringify({audit:copy,version:0})});records.set(copy.id,{...copy,_version:result.version,_author:result.author,_dirty:false});conflicts++;}
  await onProgress([...records.values()]);
 }
 return {audits:[...records.values()].sort((a,b)=>b.created.localeCompare(a.created)),conflicts};
}
