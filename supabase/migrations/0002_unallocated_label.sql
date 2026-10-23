create or replace view budget_review as
 select coalesce(s.month,b.month) as month, n.id centre_id,coalesce(n.code,s.centre) centre,coalesce(s.currency,b.currency) currency,
 b.amount budget_amount,coalesce(s.effective_amount,0) actual_amount,
 case when b.amount is null then null else coalesce(s.effective_amount,0)-b.amount end variance_amount,
 case when b.amount is null then 'no budget' when coalesce(s.effective_amount,0)>b.amount then 'over budget' else 'within budget' end finding
 from monthly_spend s full join budgets b on b.centre_id=s.centre_id and b.month=s.month and b.currency=s.currency
 left join centres n on n.id=coalesce(s.centre_id,b.centre_id);
