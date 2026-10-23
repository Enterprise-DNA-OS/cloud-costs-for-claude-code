# Cloud Costs for Claude Code: operating instructions

Read the README and docs/replace-vantage.md before handling a real export. This is an internal cloud cost review desk for a trusted operator. The demo business is fictional. Use the operator supplied business identity in brand.json.

## Work from evidence

Read records before changing them. Use the CLI for recurring work and present the resulting evidence. Never invent spend, approvals, forecast certainty or savings. Keep currencies separate and state the charge period. Billed and effective cost are different measures.

## One route for each job

| Request | Recipe |
|---|---|
| actions | /actions |
| activity | /activity |
| add | /add |
| add action | /add-action |
| allocate | /allocate |
| allocation check | /allocation-check |
| attention | /attention |
| budget | /budget |
| budget review | /budget-review |
| close action | /close-action |
| compliance | /compliance |
| cost changes | /cost-changes |
| credits | /credits |
| customise | /customise |
| docs | /docs |
| draft owner | /draft-owner |
| draft review | /draft-review |
| export | /export |
| forecast | /forecast |
| freshness | /freshness |
| help | /help |
| import | /import |
| list | /list |
| log | /log |
| metric | /metric |
| new view | /new-view |
| owner load | /owner-load |
| set owner | /set-owner |
| show | /show |
| showback | /showback |
| spend | /spend |
| unallocated | /unallocated |
| unit costs | /unit-costs |
| view | /view |
| weekly review | /weekly-review |

## Rules

All CLI writes identify the actor. No sends, purchases, cloud-resource actions or provider credentials. Drafts stay in drafts/. Use explicit operator approval before replacing a dataset; first dry-run and reconcile. Never overwrite exports. An allocation change restates history, so preserve approved statements first. Ambiguous names require an exact code.

The database is not a hosted multi-tenant product. Use one dedicated database with restricted operator access. The audit trail is not tamper-proof. Read docs/compliance.md for the scope of each rule. A compliance finding is a review prompt, not a certification.

## Files and validation

scripts/costs.mjs is the one domain CLI. scripts/lib/db.mjs selects the database. supabase/migrations contains forward migrations. Never change an applied migration. views.json and documents.json declare the existing HTML renderer outputs. All agent runtimes use .claude/commands.

Run npm test after changes. Use temporary data for tests. Never seed a real database. npm run demo is for the fictional local example. New recurring jobs get a recipe and a meaningful check in scripts/smoke.mjs.

Built and run for you through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=vantage
