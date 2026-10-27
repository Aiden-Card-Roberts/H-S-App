import express from 'express';
import {createHash} from 'node:crypto';
import {defaultPpeItems,validatePpeCatalog,validatePpeRequest,nextPpeStatuses} from '../src/ppe-model.js';
import {transaction} from './database.js';
import {HttpError,requireValue} from './security.js';
export function registerPpeRoutes(app,{db,now,origin,authenticated,csrf,verified,owner,paid,jsonOnly}){
 function catalog(companyId){const row=db.prepare('SELECT * FROM ppe_catalogs WHERE company_id=?').get(companyId);return row?{items:JSON.parse(row.payload),version:row.version,provisional:false}:{items:structuredClone(defaultPpeItems),version:0,provisional:false};}
 function represent(row){return {...JSON.parse(row.payload),status:row.status,submittedAt:new Date(row.submitted).toISOString(),requestedBy:row.requester_name,managerNote:row.manager_note,reviewedBy:row.reviewer_name,reviewedAt:row.reviewed?new Date(row.reviewed).toISOString():null,_version:row.version,_author:row.author_id};}
 app.get('/api/ppe/catalog',authenticated,verified,(req,res)=>res.json(catalog(req.company.id)));
 app.put('/api/ppe/catalog',origin,authenticated,csrf,verified,owner,paid,jsonOnly,express.json({limit:'32kb'}),(req,res)=>{
  const {version}=req.body;requireValue(Number.isInteger(version)&&version>=0,400,'A PPE list version is required.');let items;try{items=validatePpeCatalog(req.body.items);}catch(error){throw new HttpError(400,error.message);}
  const result=transaction(db,()=>{const old=catalog(req.company.id);requireValue(old.version===version,409,'The PPE list changed on another device. Refresh before editing it.');db.prepare('INSERT INTO ppe_catalogs VALUES(?,?,?) ON CONFLICT(company_id) DO UPDATE SET payload=excluded.payload,version=excluded.version').run(req.company.id,JSON.stringify(items),version+1);return {items,version:version+1,provisional:false};});res.json(result);
 });
 app.get('/api/ppe/requests',authenticated,verified,(req,res)=>{const rows=req.identity.role==='owner'?db.prepare('SELECT * FROM ppe_requests WHERE company_id=? ORDER BY submitted DESC').all(req.company.id):db.prepare('SELECT * FROM ppe_requests WHERE company_id=? AND author_id=? ORDER BY submitted DESC').all(req.company.id,req.identity.id);res.json({requests:rows.map(represent)});});
 app.post('/api/ppe/requests',origin,authenticated,csrf,verified,paid,jsonOnly,express.json({limit:'22mb'}),(req,res)=>{
  let request;try{request=validatePpeRequest(req.body.request);}catch(error){throw new HttpError(400,error.message);}
  const fingerprint=createHash('sha256').update(JSON.stringify(request)).digest('hex');
  const result=transaction(db,()=>{const old=db.prepare('SELECT * FROM ppe_requests WHERE company_id=? AND id=?').get(req.company.id,request.id);
   if(old){requireValue(old.author_id===req.identity.id,403,'This PPE request belongs to another inspector.');requireValue(old.fingerprint===fingerprint,409,'This request was already submitted with different details. Keep it as a new draft.','ppe_request_conflict');return represent(old);}
   const item=catalog(req.company.id).items.find(item=>item.id===request.itemId);requireValue(item,422,'This PPE item is no longer on the company list. Refresh and choose an available item.');requireValue(!item.sizeRequired||request.size,422,'Add the required size for this PPE item.');requireValue(!request.size||!item.sizes.length||item.sizes.includes(request.size),422,'Choose an available size from the company list.');
   db.prepare('INSERT INTO ppe_requests(id,company_id,author_id,requester_name,payload,fingerprint,status,version,submitted,manager_note,reviewer_name,reviewed) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(request.id,req.company.id,req.identity.id,req.identity.name,JSON.stringify({...request,itemName:item.name}),fingerprint,'pending',1,now(),'','',null);
   return represent(db.prepare('SELECT * FROM ppe_requests WHERE company_id=? AND id=?').get(req.company.id,request.id));
  });res.status(201).json({request:result});
 });
 app.patch('/api/ppe/requests/:id',origin,authenticated,csrf,verified,owner,paid,jsonOnly,express.json({limit:'8kb'}),(req,res)=>{
  const {status,version}=req.body;const note=req.body.note??'';requireValue(typeof note==='string'&&note.length<=2000,400,'Manager notes must be no more than 2,000 characters.');requireValue(status!=='declined'||note.trim(),400,'Give a reason when declining a PPE request.');
  const result=transaction(db,()=>{const old=db.prepare('SELECT * FROM ppe_requests WHERE company_id=? AND id=?').get(req.company.id,req.params.id);requireValue(old,404,'PPE request not found.');requireValue(Number.isInteger(version)&&old.version===version,409,'This request changed. Refresh before reviewing it.');requireValue(nextPpeStatuses[old.status]?.includes(status),400,'Choose an available next status.');db.prepare('UPDATE ppe_requests SET status=?,manager_note=?,reviewer_name=?,reviewed=?,version=version+1 WHERE company_id=? AND id=?').run(status,note.trim(),req.identity.name,now(),req.company.id,old.id);return represent(db.prepare('SELECT * FROM ppe_requests WHERE company_id=? AND id=?').get(req.company.id,old.id));});res.json({request:result});
 });
}
