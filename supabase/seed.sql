insert into centres(code,name,owner,purpose,review_on) values
 ('APP','Kauri customer application','Mara','Allocate hosting costs to the service owner',current_date+180),
 ('OPS','Kauri shared operations','Hemi','Review shared infrastructure allocation',current_date+180),
 ('LAB','Kauri research sandbox','','',current_date-10) on conflict do nothing;
insert into datasets(code,file_hash,source,row_count,imported_by) values ('DEMO','demo-v1','Fictional demonstration, never a customer export',8,'Demo seed') on conflict do nothing;
insert into costs(dataset_id,row_number,start_on,end_on,provider,account,service,resource,currency,billed,effective,charge_category,source_data)
 select d.id,x.i,current_date-x.days,current_date-x.days+1,x.provider,x.account,x.service,'demo-'||x.i,x.currency,x.billed,x.effective,'Usage','{"demo":true}'::jsonb
 from datasets d cross join (values
 (1,8,'AWS','production','Compute','USD',100::numeric,90::numeric),
 (2,1,'AWS','production','Compute','USD',210,180),
 (3,8,'AWS','shared','Database','USD',60,60),
 (4,1,'AWS','shared','Database','USD',80,80),
 (5,1,'AWS','production','Credit','USD',-20,-20),
 (6,1,'Azure','sandbox','Storage','USD',30,30),
 (7,1,'Azure','regional','Storage','NZD',45,45),
 (8,15,'AWS','shared','Database','USD',40,40)
 ) as x(i,days,provider,account,service,currency,billed,effective) where d.code='DEMO' on conflict do nothing;
insert into allocations(provider,account,centre_id,weight_bps,reason)
 select x.provider,x.account,n.id,x.weight,'Demo account allocation' from (values('AWS','production','APP',10000),('AWS','shared','APP',6000),('AWS','shared','OPS',4000),('Azure','regional','OPS',10000)) x(provider,account,code,weight) join centres n on n.code=x.code on conflict do nothing;
insert into budgets(centre_id,month,currency,amount) select id,date_trunc('month',current_date)::date,'USD',100 from centres where code='APP' on conflict do nothing;
insert into budgets(centre_id,month,currency,amount) select id,date_trunc('month',current_date)::date,'NZD',100 from centres where code='OPS' on conflict do nothing;
insert into metrics(centre_id,month,unit,quantity) select id,date_trunc('month',current_date)::date,'active customers',20 from centres where code='APP' on conflict do nothing;
insert into actions(code,title,centre_id,owner,due_on) select 'COST-01','Explain the compute increase',id,'Mara',current_date-2 from centres where code='APP' on conflict do nothing;
insert into actions(code,title,centre_id,owner,due_on) select 'COST-02','Review shared database allocation',id,'Hemi',current_date+4 from centres where code='OPS' on conflict do nothing;
