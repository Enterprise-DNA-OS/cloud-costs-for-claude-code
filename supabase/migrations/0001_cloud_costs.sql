create table centres (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 owner text not null default '', purpose text not null default '', review_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table datasets (
 id uuid primary key default gen_random_uuid(), code text not null unique, file_hash text not null,
 source text not null, row_count integer not null, imported_by text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table costs (
 id uuid primary key default gen_random_uuid(), dataset_id uuid not null references datasets(id) on delete cascade,
 row_number integer not null, start_on date not null, end_on date not null check(end_on>start_on),
 provider text not null, account text not null, service text not null, resource text not null default '',
 currency text not null check(currency ~ '^[A-Z]{3}$'), billed numeric(22,6) not null, effective numeric(22,6) not null,
 charge_category text not null default '', source_data jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(dataset_id,row_number)
);
create index costs_period on costs(start_on,provider,account,currency);
create table allocations (
 id uuid primary key default gen_random_uuid(), provider text not null, account text not null,
 centre_id uuid not null references centres(id), weight_bps integer not null check(weight_bps between 1 and 10000),
 reason text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(provider,account,centre_id)
);
create table budgets (
 id uuid primary key default gen_random_uuid(), centre_id uuid not null references centres(id), month date not null check(extract(day from month)=1),
 currency text not null check(currency ~ '^[A-Z]{3}$'), amount numeric(22,6) not null check(amount>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),unique(centre_id,month,currency)
);
create table metrics (
 id uuid primary key default gen_random_uuid(), centre_id uuid not null references centres(id), month date not null check(extract(day from month)=1),
 unit text not null, quantity numeric(22,6) not null check(quantity>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),unique(centre_id,month,unit)
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, title text not null, centre_id uuid not null references centres(id),
 owner text not null, due_on date not null, status text not null default 'open' check(status in ('open','closed')),
 evidence text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
do $$ declare t text; begin foreach t in array array['centres','datasets','costs','allocations','budgets','metrics','actions','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;end $$;
create view allocated_costs as
 select c.*, a.centre_id, coalesce(n.code,'UNALLOCATED') centre,coalesce(n.name,'Unallocated') centre_name,
 coalesce(n.owner,'') owner,coalesce(a.weight_bps,10000) weight_bps,
 c.billed*coalesce(a.weight_bps,10000)/10000 billed_amount,
 c.effective*coalesce(a.weight_bps,10000)/10000 effective_amount
 from costs c left join allocations a on a.provider=c.provider and a.account=c.account left join centres n on n.id=a.centre_id;
create view monthly_spend as
 select date_trunc('month',start_on)::date as month, centre_id,centre,owner,currency,
 sum(billed_amount) billed_amount,sum(effective_amount) effective_amount,count(*)::integer allocated_rows
 from allocated_costs group by 1,2,3,4,5;
create view budget_review as
 select coalesce(s.month,b.month) as month, n.id centre_id,n.code centre,coalesce(s.currency,b.currency) currency,
 b.amount budget_amount,coalesce(s.effective_amount,0) actual_amount,
 case when b.amount is null then null else coalesce(s.effective_amount,0)-b.amount end variance_amount,
 case when b.amount is null then 'no budget' when coalesce(s.effective_amount,0)>b.amount then 'over budget' else 'within budget' end finding
 from monthly_spend s full join budgets b on b.centre_id=s.centre_id and b.month=s.month and b.currency=s.currency
 left join centres n on n.id=coalesce(s.centre_id,b.centre_id);
create view unit_costs as
 select m.month,n.code centre,s.currency,m.unit,m.quantity,s.effective_amount,
 round(s.effective_amount/m.quantity,6) unit_cost_amount
 from metrics m join centres n on n.id=m.centre_id join monthly_spend s on s.centre_id=m.centre_id and s.month=m.month;
create view compliance_findings as
 select 'allocation' rule,provider||' / '||account reference,'Account has no allocation' finding from costs c
 where not exists(select 1 from allocations a where a.provider=c.provider and a.account=c.account) group by provider,account
 union all select 'allocation_total',provider||' / '||account,'Weights do not total 100 percent' from allocations group by provider,account having sum(weight_bps)<>10000
 union all select 'accountability',code,'Cost centre has no owner' from centres where owner=''
 union all select 'privacy_review',code,'Purpose or personal-information review is missing or due' from centres where purpose='' or review_on is null or review_on<current_date
 union all select 'freshness',code,'Latest charge period is more than three days old' from datasets d where (select max(end_on) from costs where dataset_id=d.id)<current_date-3
 union all select 'budget',coalesce(centre,'UNALLOCATED')||' / '||month||' / '||currency,'No monthly budget recorded' from budget_review where finding='no budget'
 union all select 'follow_up',code,'Open investigation is overdue' from actions where status='open' and due_on<current_date;
revoke all on allocated_costs,monthly_spend,budget_review,unit_costs,compliance_findings from public;
