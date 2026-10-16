import {configFromEnv} from './config.js';
import {openDatabase} from './database.js';
import {createApp} from './app.js';
import {createStripe} from './billing.js';
import {createMailer} from './mail.js';
process.umask(0o077);
const config=configFromEnv();const db=openDatabase(config.databasePath);const app=createApp({config,db,stripe:createStripe(config),mailer:createMailer(config)});
const server=app.listen(config.port,'0.0.0.0',()=>console.log(`Fieldcheck account server listening on port ${config.port}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
