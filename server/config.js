import path from 'node:path';
export const PLANS={team5:{id:'team5',name:'Team 5',seats:5,amount:5500,currency:'gbp',interval:'month'},team10:{id:'team10',name:'Team 10',seats:10,amount:7500,currency:'gbp',interval:'month'}};
export function configFromEnv(env=process.env){
 const production=env.NODE_ENV==='production';
 const appUrl=(env.APP_URL||env.RENDER_EXTERNAL_URL||'http://localhost:3000').replace(/\/$/,'');
 const parsed=new URL(appUrl);if(parsed.pathname!=='/'||parsed.search||parsed.hash)throw Error('APP_URL must be the site origin without a path.');
 if(production&&parsed.protocol!=='https:')throw Error('APP_URL must use HTTPS in production.');
 if(production&&!env.APP_URL&&!env.RENDER_EXTERNAL_URL)throw Error('APP_URL is required in production.');
 if(production)for(const name of ['DATABASE_PATH','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_TEAM5','STRIPE_PRICE_TEAM10','RESEND_API_KEY','MAIL_FROM'])if(!env[name])throw Error(`${name} is required in production.`);
 if(env.STRIPE_PRICE_TEAM5&&env.STRIPE_PRICE_TEAM5===env.STRIPE_PRICE_TEAM10)throw Error('The two plans must use different Stripe prices.');
 return {production,appUrl,port:Number(env.PORT||3000),databasePath:env.DATABASE_PATH||path.resolve('data/fieldcheck.sqlite'),trustProxy:env.TRUST_PROXY==='1'?1:false,stripeKey:env.STRIPE_SECRET_KEY,webhookSecret:env.STRIPE_WEBHOOK_SECRET,priceIds:{team5:env.STRIPE_PRICE_TEAM5,team10:env.STRIPE_PRICE_TEAM10},mailKey:env.RESEND_API_KEY,mailFrom:env.MAIL_FROM,staticDir:path.resolve('dist'),devOutbox:path.resolve('data/dev-mail.jsonl')};
}
