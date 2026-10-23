# Cloud Costs for Claude Code

Your cloud charges, cost owners, shared allocations, budgets and investigation evidence in a database you own. Import a daily cost export and prepare the next owner review.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and run the demo. | Your allocation rules, Vantage exports, documents and agreed connections. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=vantage) · [Instead of Vantage](https://enterprisedna.co/omni/instead-of/vantage?utm_source=github&utm_medium=readme&utm_campaign=vantage)

## Start with a working review

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/cloud-costs-for-claude-code.git
cd cloud-costs-for-claude-code
npm install
npm run demo
npm run costs -- weekly-review
npm run docs
npm run view
```

Open the folder with Claude Code, Codex, OpenCode or Cursor. AGENTS.md and CLAUDE.md use the same command recipes. PGlite runs locally without a database service. DATABASE_URL selects PostgreSQL; DATA_DIR selects a different local directory. Use a trusted operator connection to a dedicated database. Never seed a working customer database.

The fictional Kauri demo includes a compute increase, shared database costs split between owners, a credit, an unallocated account, a missing budget and an overdue investigation. NZD and USD remain separate. Demo dates are relative to today. Repeated seed runs preserve existing records.

## The weekly rituals

Monday: /weekly-review brings together /showback, /budget-review, /cost-changes, /attention and /allocation-check. Before assigning the bill: /unallocated and /allocate. At the review: /add-action and /log. After investigating: /close-action requires evidence. /draft-review and /draft-owner write local drafts and never send.

31 CLI commands and 35 slash-command recipes cover the recurring jobs. Run `npm run costs -- help` for commands and required options. Every command accepts --json. Exact codes, case-insensitive names and partial UUIDs work for centre and action references. Ambiguous matches list candidates and exit with failure.

## Costs that reconcile

Billed cost and effective cost are stored separately with six decimal places. All calculations run in the database. Credits keep their sign. Account allocation shares must total exactly 100 percent; unallocated costs remain visible and included in reconciliation. Budgets use effective cost. No currency conversions or cross-currency totals are produced.

Imports validate every row before writing, retain every source column and reject overlapping provider/account date ranges across datasets. An unchanged file is idempotent. Changed datasets need explicit replacement with a reason, and replacement is atomic. Allocation changes restate history, with the old shares in the activity log; save an approved statement before revising them.

The free version works on imported daily snapshots. It does not collect bills, buy cloud commitments, turn resources off or provide a live monitoring service. A run-rate forecast shows observed days and its linear assumption. Sparse data and future changes can make that estimate unsuitable for planning. [Record checks and sources](docs/compliance.md).

## Ten questions this build answers

These are tested questions, not a claim that Vantage cannot answer them.

1. Which owners received the shared database costs? Run showback.
2. Which accounts still have no cost owner? Run unallocated.
3. Do allocated totals match source costs in each currency? Run allocation-check.
4. Which recorded budgets have already been exceeded? Run budget-review.
5. Which service changed most between the last two imported weeks? Run cost-changes.
6. Which negative charges reduced the bill? Run credits.
7. What did each recorded active customer cost to serve? Run unit-costs.
8. Which owner has overdue investigations? Run owner-load.
9. Which source periods or personal-information reviews are stale? Run compliance.
10. Who changed an allocation and what was the previous split? Run activity.

## Bring your history

Choose the daily FOCUS CSV export in Vantage. Import one complete population with one dataset name:

```bash
npm run costs -- import vantage --file=imports/costs.csv --dataset=all-cloud --actor="Your name" --dry-run
npm run costs -- import vantage --file=imports/costs.csv --dataset=all-cloud --actor="Your name"
```

[Export steps, supported fields, replacement semantics and reconciliation](docs/replace-vantage.md). The importer does not read default Vantage, Comparison or Count exports. The included fixture is synthetic. Check a real export before adoption.

## Documents and views

Change brand.json once. npm run docs renders an owner cost statement and an account allocation record for each centre. npm run view renders the weekly review and unit-cost dashboard. They are private read-only HTML snapshots. Print them to PDF after reviewing. Drafts, imports, exports and generated output stay outside version control.

## Your first hour: ten things to ask for

1. Put our business name and logo on the owner statement.
2. Test one daily export without saving it.
3. Compare billed and effective costs with the original report.
4. Add our cost centres and their owners.
5. Split the shared account according to our agreement.
6. Record the current month's budgets by currency.
7. Add the active-customer count for the application.
8. Assign the largest unexplained cost change.
9. Draft this week's owner review.
10. Add a field for our internal purchase reference.

/customise writes a forward migration and tests the requested change. /new-view adds a read-only report through the existing renderer. [What a screen adds](docs/why-no-front-end.md).

## Price context and evidence

The target is the larger cloud cost review desk. Vantage's own Marketplace Custom offer lists USD 1,000 a month, or USD 12,000 for twelve months. This is a public rate comparison, not a customer invoice. Vantage also has cheaper plans and privately quoted Enterprise offers. [Selection, scores and primary sources](docs/research.md).

## Verification

npm test creates a temporary database, migrates and seeds twice, exercises every CLI command, and checks import rollback, duplicate-import protection, overlapping periods, credits, currencies, decimal precision, shared allocation, budgets, unit costs, drafts and escaped HTML. CI defines Node 20 and 22 on Linux and Windows, plus PostgreSQL 17. A configured workflow is not proof of a passing run; inspect the actual results. TEST_DATABASE_URL must name an empty disposable database.

## Built and run for you

Enterprise DNA maps the agreed history, builds your rules and paperwork, and adds authorised data collection, a web view or a different stack when agreed. Omni by Enterprise DNA runs it for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=vantage).

MIT. Not affiliated with Vantage or Anthropic. Hosting and agent usage have their own costs.
