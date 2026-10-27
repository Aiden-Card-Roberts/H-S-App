const clothingSizes=['Small','Medium','Large','Extra Large','2 Extra Large','3 Extra Large'];
export const defaultPpeItems=[
 {id:'fr-hi-vis-waterproof-coat',name:'Fire retardant Hi-vis waterproof coat',sizes:[...clothingSizes],sizeRequired:true},
 {id:'fr-hi-vis-sweatshirt',name:'Fire retardant Hi-vis sweatshirt',sizes:[...clothingSizes],sizeRequired:true},
 {id:'fr-hi-vis-polo-ls',name:'Fire retardant Hi-vis polo shirt (L/S)',sizes:[...clothingSizes],sizeRequired:true},
 {id:'fr-hi-vis-trousers',name:'Fire retardant Hi-vis trousers',sizes:[...clothingSizes],sizeRequired:true},
 {id:'hi-vis-waterproof-trousers',name:'Hi-vis waterproof trousers',sizes:[...clothingSizes],sizeRequired:true},
 {id:'hi-vis-coverall',name:'Hi-Vis Coverall',sizes:[...clothingSizes],sizeRequired:true},
 {id:'hi-vis-waterproof-coverall',name:'Hi-Vis waterproof Coverall',sizes:[...clothingSizes],sizeRequired:true},
 {id:'haix-boots',name:'Haix Boots',sizes:['5','6','7','8','9','10','11','12','13'],sizeRequired:true}
];
export const ppeStatuses={draft:'Draft',queued:'Saved — not yet submitted',pending:'Requested',approved:'Approved',declined:'Declined',issued:'Issued'};
export const nextPpeStatuses={pending:['approved','declined'],approved:['issued','declined'],declined:[],issued:[]};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const itemId=/^[a-z0-9-]{1,64}$/i;
function value(text,label,max,required=false){if(typeof text!=='string'||text.length>max||(required&&!text.trim()))throw Error(`${label} is required and must be no more than ${max} characters.`);return text.trim();}
export function validatePpeCatalog(items){
 if(!Array.isArray(items)||!items.length||items.length>100)throw Error('Add between 1 and 100 PPE items.');
 const ids=new Set(),names=new Set();return items.map(item=>{if(!itemId.test(item?.id)||ids.has(item.id))throw Error('PPE item identifiers must be unique.');const name=value(item.name,'Item name',120,true);if(names.has(name.toLowerCase()))throw Error('PPE item names must be unique.');if(!Array.isArray(item.sizes)||item.sizes.length>40)throw Error('Use no more than 40 size options per item.');const sizes=item.sizes.map(size=>value(size,'Size',60,true));if(new Set(sizes).size!==sizes.length)throw Error('Size options must be unique.');ids.add(item.id);names.add(name.toLowerCase());if(item.sizeRequired!==undefined&&typeof item.sizeRequired!=='boolean')throw Error('Size required must be a checkbox value.');return {id:item.id,name,sizes,sizeRequired:item.sizeRequired===undefined?sizes.length>0:item.sizeRequired};});
}
export function validatePpeRequest(request,{draft=false}={}){
 if(!request||!uuid.test(request.id)||typeof request.created!=='string'||!Number.isFinite(Date.parse(request.created)))throw Error('The request identity or date is invalid.');
 const selected=value(request.itemId,'PPE item',64,!draft);if(selected&&!itemId.test(selected))throw Error('Select a valid PPE item.');
 const quantity=Number(request.quantity);if(!Number.isInteger(quantity)||quantity<1||quantity>100)throw Error('Choose a quantity between 1 and 100.');
 const reason=value(request.reason,'Reason for request',2000,!draft),size=value(request.size,'Size / specification',120),site=value(request.site,'Site',200),gang=value(request.gang,'Gang',100);
 if(!Array.isArray(request.photos)||request.photos.length>(5)||(!draft&&!request.photos.length))throw Error('Add at least one evidence photo before submitting (maximum 5).');
 const photos=request.photos.map(photo=>{if(!uuid.test(photo?.id)||typeof photo.data!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo.data)||photo.data.length>4*1024*1024)throw Error('Each evidence photo must be a JPEG smaller than 3 MB.');return {id:photo.id,data:photo.data,caption:value(photo.caption,'Photo caption',200)};});
 if(new Set(photos.map(p=>p.id)).size!==photos.length)throw Error('Evidence photo identifiers must be unique.');
 return {id:request.id,created:request.created,itemId:selected,size,quantity,reason,site,gang,photos};
}
export function newPpeRequest(){return {id:crypto.randomUUID(),created:new Date().toISOString(),itemId:'',itemName:'',size:'',quantity:1,reason:'',site:'',gang:'',photos:[],status:'draft'};}
