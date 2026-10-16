import Stripe from 'stripe';
import {randomUUID} from 'node:crypto';
import {PLANS} from './config.js';
import {requireValue} from './security.js';
export function createStripe(config){return config.stripeKey?new Stripe(config.stripeKey,{maxNetworkRetries:2,httpClient:Stripe.createFetchHttpClient()}):null;}
export function pricePlan(price,config){const plan=Object.values(PLANS).find(p=>config.priceIds[p.id]===price.id);return plan&&price.active!==false&&price.unit_amount===plan.amount&&price.currency==='gbp'&&price.recurring?.interval==='month'&&price.recurring?.interval_count===1?plan:null;}
export async function checkout({stripe,config,db,company,user,planId}){
 const plan=PLANS[planId];requireValue(plan,400,'Choose a valid plan.');requireValue(stripe&&config.priceIds[planId],503,'Payments have not been connected yet.');
 requireValue(!company.stripe_subscription||['canceled','incomplete_expired'].includes(company.status),409,'Use Manage subscription to change your existing plan.');
 const price=await stripe.prices.retrieve(config.priceIds[planId]);requireValue(pricePlan(price,config)?.id===planId,503,'The configured Stripe price does not match this plan.');
 let customer=company.stripe_customer;
 if(!customer){const created=await stripe.customers.create({email:user.email,name:company.name,metadata:{company_id:company.id}},{idempotencyKey:`company-${company.id}`});customer=created.id;db.prepare('UPDATE companies SET stripe_customer=? WHERE id=?').run(customer,company.id);}
 const previous=db.prepare('SELECT * FROM checkout_sessions WHERE company_id=?').get(company.id);
 if(previous){const old=await stripe.checkout.sessions.retrieve(previous.session_id);requireValue(old.status!=='complete',409,'Payment is being confirmed. Refresh your account shortly.');if(old.status==='open'){if(previous.plan===planId)return {url:old.url};await stripe.checkout.sessions.expire(old.id);}}
 const session=await stripe.checkout.sessions.create({mode:'subscription',customer,client_reference_id:company.id,line_items:[{price:config.priceIds[planId],quantity:1}],subscription_data:{metadata:{company_id:company.id}},success_url:`${config.appUrl}/?checkout=success#account`,cancel_url:`${config.appUrl}/?checkout=cancelled#account`,allow_promotion_codes:false},{idempotencyKey:`checkout-${company.id}-${randomUUID()}`});
 db.prepare('INSERT INTO checkout_sessions VALUES(?,?,?) ON CONFLICT(company_id) DO UPDATE SET session_id=excluded.session_id,plan=excluded.plan').run(company.id,session.id,planId);
 return {url:session.url};
}
export async function portal({stripe,config,company}){
 requireValue(stripe&&company.stripe_customer,409,'Start a subscription first.');
 const prices=await Promise.all(Object.values(config.priceIds).map(id=>stripe.prices.retrieve(id)));
 requireValue(prices.every(p=>pricePlan(p,config)),503,'Billing prices need to be checked.');
 const grouped=new Map();for(const p of prices){const product=typeof p.product==='string'?p.product:p.product.id;grouped.set(product,[...(grouped.get(product)||[]),p.id]);}
 const configuration=await stripe.billingPortal.configurations.create({business_profile:{headline:'Manage your Fieldcheck subscription'},features:{customer_update:{enabled:true,allowed_updates:['email','address','tax_id']},invoice_history:{enabled:true},payment_method_update:{enabled:true},subscription_cancel:{enabled:true,mode:'at_period_end',cancellation_reason:{enabled:false}},subscription_update:{enabled:true,default_allowed_updates:['price'],proration_behavior:'create_prorations',products:[...grouped].map(([product,prices])=>({product,prices}))}}});
 return stripe.billingPortal.sessions.create({customer:company.stripe_customer,configuration:configuration.id,return_url:`${config.appUrl}/#account`});
}
export async function applyStripeEvent({stripe,config,db,event,now}){
 if(db.prepare('SELECT id FROM stripe_events WHERE id=?').get(event.id))return;
 let subscriptionId;
 if(event.type.startsWith('customer.subscription.'))subscriptionId=event.data.object.id;
 else if(event.type==='checkout.session.completed'&&event.data.object.mode==='subscription')subscriptionId=event.data.object.subscription;
 else if(['invoice.paid','invoice.payment_failed'].includes(event.type))subscriptionId=event.data.object.parent?.subscription_details?.subscription||event.data.object.subscription;
 if(typeof subscriptionId==='object')subscriptionId=subscriptionId.id;
 let sub;if(subscriptionId)sub=await stripe.subscriptions.retrieve(subscriptionId);
 db.exec('BEGIN IMMEDIATE');try{
  if(db.prepare('SELECT id FROM stripe_events WHERE id=?').get(event.id)){db.exec('COMMIT');return;}
  if(sub){const customer=typeof sub.customer==='string'?sub.customer:sub.customer.id;const company=db.prepare('SELECT * FROM companies WHERE stripe_customer=?').get(customer);
   if(company&&(!company.stripe_subscription||company.stripe_subscription===sub.id||['canceled','incomplete_expired'].includes(company.status))){const item=sub.items?.data?.[0];const plan=sub.items?.data?.length===1&&item.quantity===1?pricePlan(item.price,config):null;const end=(item?.current_period_end||sub.current_period_end||0)*1000;
    db.prepare('UPDATE companies SET stripe_subscription=?,plan=?,status=?,paid_until=? WHERE id=?').run(sub.id,plan?.id||null,sub.status,plan&&sub.status==='active'?end:0,company.id);
   }
  }
  db.prepare('INSERT INTO stripe_events VALUES(?,?)').run(event.id,now());db.exec('COMMIT');
 }catch(error){db.exec('ROLLBACK');throw error;}
}
