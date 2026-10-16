import {randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export const token=()=>randomBytes(32).toString('hex');
export const hash=value=>createHash('sha256').update(value).digest('hex');
export async function passwordHash(password){const salt=randomBytes(16).toString('hex');const result=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return `${salt}:${result.toString('hex')}`;}
export async function passwordMatches(password,encoded){const [salt,key]=(encoded||'00000000000000000000000000000000:'+Buffer.alloc(64).toString('hex')).split(':');const result=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});const expected=Buffer.from(key,'hex');return expected.length===result.length&&timingSafeEqual(expected,result);}
export class HttpError extends Error{constructor(status,message,code){super(message);this.status=status;this.code=code;}}
export const requireValue=(condition,status,message,code)=>{if(!condition)throw new HttpError(status,message,code);};
export function text(value,label,max=200){requireValue(typeof value==='string'&&value.trim().length>0&&value.trim().length<=max,400,`${label} is required (maximum ${max} characters).`);return value.trim();}
export function email(value){const result=text(value,'Email',254).toLowerCase();requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result),400,'Enter a valid email address.');return result;}
export function password(value){requireValue(typeof value==='string'&&value.length>=12&&value.length<=128,400,'Use a password between 12 and 128 characters.');return value;}
