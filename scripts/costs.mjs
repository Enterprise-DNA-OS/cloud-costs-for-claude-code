#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';

export const reports={
 'spend':`select provider,service,currency,sum(billed) billed_amount,sum(effective) effective_amount from costs group by 1,2,3 order by 1,2,3`,
 'showback':`select month,centre,owner,currency,billed_amount,effective_amount from monthly_spend order by month,centre,currency`,
 'budget-review':`select month,centre,currency,budget_amount,actual_amount,variance_amount,finding from budget_review order by month,centre,currency`,
 'unallocated':`select provider,account,currency,sum(effective_amount) effective_amount from allocated_costs where centre_id is null group by 1,2,3 order by 1,2,3`,
 'unit-costs':`select * from unit_costs order by month,centre,currency,unit`,
 'cost-changes':`with bounds as(select max(start_on) last_day from costs), x as(select provider,service,currency,
 sum(case when start_on>b.last_day-7 then effective else 0 end) recent_amount,
 sum(case when start_on<=b.last_day-7 then effective else 0 end) previous_amount,
 count(distinct case when start_on>b.last_day-7 then start_on end)::int recent_days,
 count(distinct case when start_on<=b.last_day-7 then start_on end)::int previous_days
 from costs cross join bounds b where start_on>b.last_day-14 group by 1,2,3)
 select *,recent_amount-previous_amount change_amount,case when previous_amount>0 then round((recent_amount-previous_amount)/previous_amount*100,2) else null end change_percent from x order by currency,change_amount desc`,
 'freshness':`select d.code,d.source,d.updated_at imported_at,min(c.start_on) first_day,max(c.end_on) exclusive_end,count(c.id)::int rows from datasets d left join costs c on c.dataset_id=d.id group by d.id order by d.code`,
 'credits':`select provider,account,service,currency,sum(billed) billed_amount,sum(effective) effective_amount from costs where billed<0 or effective<0 group by 1,2,3,4 order by 1,2,3,4`,
 'attention':`select * from compliance_findings order by rule,reference`,
 'compliance':`select * from compliance_findings order by rule,reference`,
 'actions':`select a.id,a.code,a.title,c.code centre,a.owner,a.due_on,a.status,a.evidence from actions a join centres c on c.id=a.centre_id order by a.due_on,a.code`,
 'allocation-check':`with totals as(select currency,sum(effective) source_amount from costs group by 1), allocated as(select currency,sum(effective_amount) allocated_amount from allocated_costs group by 1)
 select t.*,a.allocated_amount,a.allocated_amount-t.source_amount difference_amount from totals t join allocated a using(currency) order by currency`,
 'activity':`select actor,action,detail,created_at from activity order by created_at,id`,
 'owner-load':`select owner,count(*)::int open_actions,count(*) filter(where due_on<current_date)::int overdue_actions from actions where status='open' group by owner order by overdue_actions desc,owner`,
 'forecast':`with x as(select date_trunc('month',c.start_on)::date as month,c.centre,c.currency,sum(c.effective_amount) actual_amount,max(c.end_on-1) last_day,count(distinct c.start_on)::int observed_days from allocated_costs c group by 1,2,3)
 select *,extract(day from last_day)::int elapsed_days,round(actual_amount/extract(day from last_day)*extract(day from (month+interval '1 month'-interval '1 day')),6) run_rate_amount,'Linear estimate; missing days and future changes are not modelled' assumption from x order by month,centre,currency`
};
const help={...Object.fromEntries(Object.keys(reports).map(k=>[k,`Read ${k}; --json available`])),
 list:'--kind=centres|datasets|allocations|budgets|metrics|costs',show:'--ref=<centre name, code or partial id>',
 add:'--kind=centre --code=APP --name=Application --owner=Mara --purpose=Cost-review --review-on=YYYY-MM-DD --actor=Name',
 'set-owner':'--ref=APP --owner=Mara --purpose=Cost-review --review-on=YYYY-MM-DD --actor=Name',
 allocate:'--provider=AWS --account=123 --weights=APP:60,OPS:40 --reason=Agreement --actor=Name',
 budget:'--ref=APP --month=YYYY-MM --currency=USD --amount=1000 --actor=Name',
 metric:'--ref=APP --month=YYYY-MM --unit=customers --quantity=100 --actor=Name',
 'add-action':'--code=COST-03 --title=Investigate --ref=APP --owner=Mara --due-on=YYYY-MM-DD --actor=Name',
 'close-action':'--ref=COST-03 --evidence=Reviewed-result --actor=Name',log:'--note=Review-note --actor=Name',
 import:'vantage --file=export.csv --dataset=all-cloud --actor=Name [--dry-run] [--replace --reason=Correction]',
 export:'--file=exports/all.json [--kind=costs for CSV]',
 'weekly-review':'Read showback, budget-review, cost-changes, attention and allocation-check',
 'draft-review':'Write a weekly review to drafts; never send', 'draft-owner':'--ref=APP; write an owner cost statement to drafts; never send',help:'List commands'};
export const commands=Object.keys(help);
const req=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}`);return o[k].trim();};
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid date: ${v}`);return v;}
const month=v=>{if(!/^\d{4}-\d{2}$/.test(v))throw Error('month must be YYYY-MM');return date(`${v}-01`);};
const decimal=v=>{if(!/^-?\d{1,16}(\.\d{1,6})?$/.test(String(v)))throw Error(`Invalid decimal: ${v} (up to six places)`);return String(v);};
const currency=v=>{if(!/^[A-Z]{3}$/.test(v))throw Error('currency must be a three-letter uppercase code');return v;};
async function resolve(db,tableName,ref){const cols=tableName==='actions'?'title':'name';const rows=await db.query(`select * from ${tableName} where lower(code)=lower($1) or lower(${cols})=lower($1) or id::text=$1`,[ref]);
 const candidates=rows.length?rows:await db.query(`select * from ${tableName} where strpos(lower(${cols}),lower($1))>0 or starts_with(id::text,lower($1)) order by code`,[ref]);
 if(candidates.length!==1)throw Error(candidates.length?`Ambiguous reference: ${candidates.map(x=>`${x.code} ${x[cols]} ${x.id}`).join('; ')}`:`No ${tableName} match: ${ref}`);return candidates[0];}
async function audit(db,actor,action,detail){await db.query('insert into activity(actor,action,detail) values($1,$2,$3)',[actor,action,JSON.stringify(detail)]);}
async function transaction(db,fn,dry=false){await db.exec('BEGIN');try{const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
const utcDay=v=>{if(/^\d{4}-\d{2}-\d{2}$/.test(v))return date(v);if(!/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.0+)?(?:Z|\+00:00)$/.test(v))throw Error(`Use daily UTC midnight FOCUS export: ${v}`);return date(v.slice(0,10));};
async function importVantage(db,o,pos){
 if(pos[0]!=='vantage')throw Error('Supported import: vantage (FOCUS daily CSV)');
 const actor=req(o,'actor'),code=req(o,'dataset'),file=req(o,'file');const raw=fs.readFileSync(file,'utf8');const hash=createHash('sha256').update(raw).digest('hex');const rows=parseCsv(raw);if(!rows.length)throw Error('Empty import');
 const prepared=rows.map((r,i)=>{const needed=k=>{const v=pick(r,k).trim();if(!v)throw Error(`Row ${i+2}: missing ${k}`);return v;};
 const start=utcDay(needed('ChargePeriodStart')),end=utcDay(needed('ChargePeriodEnd'));
 if(Date.parse(end)-Date.parse(start)!==86400000)throw Error('Daily export required: every charge period must be one UTC day');
 const provider=pick(r,'ProviderName','ServiceProviderName').trim();if(!provider)throw Error('Missing ProviderName or ServiceProviderName');
 return {start,end,provider,account:needed('BillingAccountId'),service:needed('ServiceName'),resource:pick(r,'ResourceId'),currency:currency(needed('BillingCurrency')),billed:decimal(needed('BilledCost')),effective:decimal(needed('EffectiveCost')),category:pick(r,'ChargeCategory'),source:r};});
 return transaction(db,async()=>{
 // Serialise writes which could create overlapping datasets; works in Postgres and PGlite.
 await db.exec('LOCK TABLE datasets IN EXCLUSIVE MODE');
 const [existing]=await db.query('select * from datasets where code=$1',[code]);
 if(existing?.file_hash===hash)return [{dataset:code,rows:prepared.length,status:'unchanged',dry_run:!!o['dry-run']}];
 if(existing&&!o.replace)throw Error('Dataset has changed: use --replace --reason after reviewing a dry run');
 if(existing)req(o,'reason');
 const spans=new Map();for(const r of prepared){const key=JSON.stringify([r.provider,r.account]);const s=spans.get(key)||{...r};if(r.start<s.start)s.start=r.start;if(r.end>s.end)s.end=r.end;spans.set(key,s);}
 for(const r of spans.values()){
 const overlap=await db.query(`select distinct d.code from costs c join datasets d on d.id=c.dataset_id where d.code<>$1 and c.provider=$2 and c.account=$3 and c.start_on<$5 and c.end_on>$4`,[code,r.provider,r.account,r.start,r.end]);
 if(overlap.length)throw Error(`Overlapping provider/account periods in ${overlap.map(x=>x.code).join(', ')}. Use one complete dataset per population; replace its full export.`);
 }
 let dataset=existing;if(existing){await db.query('delete from costs where dataset_id=$1',[existing.id]);await db.query('update datasets set file_hash=$2,row_count=$3,imported_by=$4 where id=$1',[existing.id,hash,prepared.length,actor]);}
 else [dataset]=await db.query('insert into datasets(code,file_hash,source,row_count,imported_by) values($1,$2,$3,$4,$5) returning *',[code,hash,'Vantage FOCUS daily CSV',prepared.length,actor]);
 for(const [i,r] of prepared.entries())await db.query(`insert into costs(dataset_id,row_number,start_on,end_on,provider,account,service,resource,currency,billed,effective,charge_category,source_data) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[dataset.id,i+1,r.start,r.end,r.provider,r.account,r.service,r.resource,r.currency,r.billed,r.effective,r.category,JSON.stringify(r.source)]);
 await audit(db,actor,'import',{dataset:code,old_hash:existing?.file_hash||null,new_hash:hash,rows:prepared.length,reason:o.reason||'Initial import'});
 return [{dataset:code,rows:prepared.length,status:existing?'replaced':'imported',dry_run:!!o['dry-run']}];
 },!!o['dry-run']);
}
export async function run(db,cmd,o={},pos=[]){
 if(reports[cmd])return db.query(reports[cmd]);
 if(cmd==='help')return Object.entries(help).map(([command,usage])=>({command,usage}));
 if(cmd==='list'){const kind=o.kind||'centres';if(!['centres','datasets','allocations','budgets','metrics','costs'].includes(kind))throw Error('Unknown list kind');return db.query(`select * from ${kind} order by id`);}
 if(cmd==='show'){const c=await resolve(db,'centres',req(o,'ref'));return [c];}
 if(cmd==='import')return importVantage(db,o,pos);
 if(cmd==='weekly-review'){const result={};for(const k of ['showback','budget-review','cost-changes','attention','allocation-check'])result[k]=await run(db,k);return result;}
 if(cmd==='export'){
 const file=path.resolve(req(o,'file'));fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});let text;
 if(o.kind){if(o.kind!=='costs')throw Error('CSV export supports --kind=costs');const rows=await run(db,'list',{kind:'costs'});const keys=['id','dataset_id','row_number','start_on','end_on','provider','account','service','resource','currency','billed','effective','charge_category'];
 const cell=v=>'"'+String(v??'').replace(/^[=+@]/,"'$&").replace(/"/g,'""')+'"';text=[keys.join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\n')+'\n';
 }else{const all={format:'cloud-costs-export-v1',exported_at:new Date().toISOString()};for(const t of ['centres','datasets','costs','allocations','budgets','metrics','actions','activity'])all[t]=await db.query(`select * from ${t} order by id`);text=JSON.stringify(all,null,2)+'\n';}
 fs.writeFileSync(file,text,{mode:0o600,flag:'wx'});return [{file}];
 }
 if(cmd==='draft-review'||cmd==='draft-owner'){
 let sections,title;
 if(cmd==='draft-review'){const data=await run(db,'weekly-review');title='Weekly cloud cost review';sections=Object.entries(data).map(([title,rows])=>({title,html:htmlTable(rows)}));}
 else{const c=await resolve(db,'centres',req(o,'ref'));title=`Cloud cost statement: ${c.name}`;sections=[{title:'Allocated costs',html:htmlTable(await db.query('select month,currency,billed_amount,effective_amount from monthly_spend where centre_id=$1 order by month,currency',[c.id]))},{title:'Open investigations',html:htmlTable(await db.query("select code,title,owner,due_on from actions where centre_id=$1 and status='open' order by due_on",[c.id]))}];}
 return [{file:writeOut('drafts',`${cmd}-${Date.now()}`,page({title,subtitle:'Draft for human review. Imported snapshots only. No infrastructure changes or messages sent.',sections}))}];
 }
 if(!commands.includes(cmd))throw Error(`Unknown command: ${cmd}`);
 const actor=req(o,'actor');
 return transaction(db,async()=>{let result;
 if(cmd==='add'){
 if(req(o,'kind')!=='centre')throw Error('add supports --kind=centre');
 const code=req(o,'code');if(!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)||code==='UNALLOCATED')throw Error('Use an uppercase centre code other than UNALLOCATED');
 result=await db.query('insert into centres(code,name,owner,purpose,review_on) values($1,$2,$3,$4,$5) returning *',[code,req(o,'name'),req(o,'owner'),req(o,'purpose'),date(req(o,'review-on'))]);
 }else if(cmd==='set-owner'){
 const c=await resolve(db,'centres',req(o,'ref'));result=await db.query('update centres set owner=$2,purpose=$3,review_on=$4 where id=$1 returning *',[c.id,req(o,'owner'),req(o,'purpose'),date(req(o,'review-on'))]);
 }else if(cmd==='allocate'){
 const provider=req(o,'provider'),account=req(o,'account'),reason=req(o,'reason');const seen=new Set();const splits=[];let sum=0;
 for(const part of req(o,'weights').split(',')){const [ref,p,...extra]=part.split(':');if(extra.length||!/^\d+(\.\d{1,2})?$/.test(p||''))throw Error('Weights require CODE:percent with up to two decimals');const bps=Math.round(Number(p)*100);if(bps<=0||bps>10000)throw Error('Weight out of range');const c=await resolve(db,'centres',ref);if(seen.has(c.id))throw Error('Duplicate centre in weights');seen.add(c.id);sum+=bps;splits.push({c,bps});}
 if(sum!==10000)throw Error('Weights must total exactly 100 percent');
 await db.exec('LOCK TABLE allocations IN EXCLUSIVE MODE');
 const before=await db.query('select * from allocations where provider=$1 and account=$2',[provider,account]);
 await db.query('delete from allocations where provider=$1 and account=$2',[provider,account]);
 for(const {c,bps} of splits)await db.query('insert into allocations(provider,account,centre_id,weight_bps,reason) values($1,$2,$3,$4,$5)',[provider,account,c.id,bps,reason]);
 result=await db.query('select * from allocations where provider=$1 and account=$2 order by centre_id',[provider,account]);await audit(db,actor,'allocation_before',{provider,account,before});
 }else if(cmd==='budget'||cmd==='metric'){
 const c=await resolve(db,'centres',req(o,'ref')),m=month(req(o,'month'));
 if(cmd==='budget')result=await db.query('insert into budgets(centre_id,month,currency,amount) values($1,$2,$3,$4) on conflict(centre_id,month,currency) do update set amount=excluded.amount returning *',[c.id,m,currency(req(o,'currency')),decimal(req(o,'amount'))]);
 else result=await db.query('insert into metrics(centre_id,month,unit,quantity) values($1,$2,$3,$4) on conflict(centre_id,month,unit) do update set quantity=excluded.quantity returning *',[c.id,m,req(o,'unit'),decimal(req(o,'quantity'))]);
 }else if(cmd==='add-action'){
 const c=await resolve(db,'centres',req(o,'ref'));result=await db.query('insert into actions(code,title,centre_id,owner,due_on) values($1,$2,$3,$4,$5) returning *',[req(o,'code'),req(o,'title'),c.id,req(o,'owner'),date(req(o,'due-on'))]);
 }else if(cmd==='close-action'){
 const a=await resolve(db,'actions',req(o,'ref'));if(a.status==='closed')throw Error('Action already closed');result=await db.query("update actions set status='closed',evidence=$2 where id=$1 returning *",[a.id,req(o,'evidence')]);
 }else if(cmd==='log')result=[{note:req(o,'note')}];
 await audit(db,actor,cmd,{input:o,result});return result;
 });
}
const human=v=>typeof v==='string'&&/^-?\d+\.\d+$/.test(v)?v.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,''):typeof v==='object'?JSON.stringify(v):v;
const flags=new Set(['json','kind','ref','code','name','owner','purpose','review-on','actor','provider','account','weights','reason','month','currency','amount','unit','quantity','title','due-on','evidence','note','file','dataset','dry-run','replace']);
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{const [cmd='help',...args]=process.argv.slice(2),o={},pos=[];for(const a of args){if(!a.startsWith('--')){pos.push(a);continue;}const at=a.indexOf('='),k=a.slice(2,at<0?undefined:at);if(!flags.has(k))throw Error(`Unknown option --${k}`);if(k in o)throw Error(`Duplicate option --${k}`);if(['json','dry-run','replace'].includes(k)&&at>=0)throw Error(`Boolean --${k} takes no value`);o[k]=at<0?true:a.slice(at+1);}
 db=await getDb();const result=await run(db,cmd,o,pos);if(o.json)console.log(JSON.stringify(result,null,2));else if(Array.isArray(result)){console.log(table(result,Object.keys(result[0]||{result:''}).map(key=>({key,label:key,format:human}))));}else for(const [title,rows] of Object.entries(result)){console.log(`\n${title}`);console.log(table(rows,Object.keys(rows[0]||{result:''}).map(key=>({key,label:key,format:human}))));}
 }catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
