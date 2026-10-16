import {mkdir,appendFile} from 'node:fs/promises';
import path from 'node:path';
export function createMailer(config){return async({to,subject,text})=>{
 if(!config.mailKey){if(config.production)throw Error('Email delivery is not configured.');await mkdir(path.dirname(config.devOutbox),{recursive:true,mode:0o700});await appendFile(config.devOutbox,JSON.stringify({to,subject,text})+'\n',{mode:0o600});return;}
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${config.mailKey}`,'content-type':'application/json'},body:JSON.stringify({from:config.mailFrom,to:[to],subject,text})});if(!response.ok)throw Error('Email delivery failed. Please try again later.');
};}
