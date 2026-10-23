# Replace the cloud cost review desk in Vantage

The free build handles imported cost records, account allocation, budgets, investigations and owner reports. It does not collect live provider bills, buy commitments, resize workloads or reproduce the Vantage platform. Keep your existing collection arrangement until its replacement is agreed and checked.

## Export

In Vantage, open the complete Cost Report for the population you want to move. Check its filters, credits, taxes, discounts and amortisation settings. Use the download icon, CSV, a daily date bin, and the FOCUS schema. Download the finished file through your own authorised Vantage account. See [Vantage Cost Reports: Export Cost Reports](https://docs.vantage.sh/cost_reports/), checked 23 October 2026.

Do not use Comparison, Count, PDF or the default Vantage layout. Budgets, ownership rules, unit metrics and investigations are not cost rows and need separate entry. Use a consistent full report for a dataset. Overlapping filtered reports can double-count the same costs.

## Import in one command

```bash
npm run costs -- import vantage --file=imports/costs.csv --dataset=all-cloud --actor="Your name" --dry-run
npm run costs -- import vantage --file=imports/costs.csv --dataset=all-cloud --actor="Your name"
```

Required columns: ChargePeriodStart, ChargePeriodEnd, ProviderName (or ServiceProviderName), BillingAccountId, ServiceName, BillingCurrency, BilledCost and EffectiveCost. ResourceId and ChargeCategory are optional. All original columns, including tags and subaccounts, remain in source_data. The current allocation grain is provider plus billing account, not resource tags or subaccounts.

Dates must describe one UTC day, with midnight boundaries and an exclusive end. Decimal costs support six places and up to sixteen whole digits; scientific notation, blank amounts and more precise values are rejected rather than rounded. Negative credits are retained. Currencies must be explicit uppercase three-letter codes and never convert automatically.

The fixture is synthetic, authored from the documented FOCUS fields. It is not a captured Vantage customer export. Check one real export before adopting this workflow.

## Reconcile

Run spend, allocation-check and freshness. Compare billed and effective totals, per currency, with the same filtered Vantage report. The import does not invent missing historical charges. Identical re-imports do nothing. Legitimately repeated rows within a source file are preserved as separate charges.

A changed file for the same dataset requires --replace and --reason. First run it with --dry-run. Replacement is atomic and replaces the whole dataset, including its previous date range. Never pass only a new partial month unless the dataset itself represents only that month. Different datasets with overlapping dates for the same provider and billing account are rejected conservatively, even if their services differ. Consolidate those reports first.

## Allocate and review

```bash
npm run costs -- allocate --provider=AWS --account=123456789012 --weights=APP:60,OPS:40 --reason="Agreed shared hosting split" --actor="Your name"
npm run costs -- budget --ref=APP --month=2026-10 --currency=USD --amount=2000 --actor="Your name"
npm run costs -- weekly-review
npm run docs
```

Create your own centres with add before allocating. Changing a split recalculates historical showback; export approved statements before changing it. Monthly costs are grouped by charge start date. Forecast is a simple calendar-day run rate and reports observed-day coverage; a sparse import is not a reliable projection.

## Keep a way out

export writes a full JSON snapshot, including original imported fields and review history. The costs CSV is a flat charge export. Neither file is a database restore tool. Take and test native database backups separately. Export files cannot overwrite existing files.

Enterprise DNA maps your records, reconciles agreed periods, adds authorised recurring provider collection and builds the workflow around your operating rules. A web view, detailed tag allocation, other stacks and additional data sources are agreed customisation work. Switch off Vantage only after the agreed replacement and recurring data supply have been tested.
