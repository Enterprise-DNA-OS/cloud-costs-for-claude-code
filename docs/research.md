# Selection evidence: Vantage

Checked 23 October 2026. Family: cloud-cost-management. Industry: professional-firms. The target registry had no build in this family. Software-spend management covers SaaS subscriptions; this build covers provider charge records and their allocation, a different operating job. Service status communications was already built in tonight's run and was excluded.

## Annual bill first

USD 12,000 a year is twelve months of the USD 1,000 Custom tier on [Vantage's own AWS Marketplace offer](https://aws.amazon.com/marketplace/pp/prodview-ciw7g7fzmfr6m), sold by Vantage. It is a public rate scenario, not an observed customer invoice or a price for every customer. The seller describes that tier as tracking cloud costs from fifty thousand dollars a month. The [main vendor pricing page](https://www.vantage.sh/pricing) lists Pro at USD 30 monthly and Business at USD 200 monthly, with Enterprise quoted privately. These are different offers, not interchangeable plan prices. No Enterprise saving is promised.

| Candidate | Bill | Data-shaped | Buyer fit | Search | Buildable | Import | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Vantage | 2 | 5 | 2 | 3 | 4 | 5 | 21 |
| Finout | 1 | 5 | 2 | 3 | 4 | 4 | 19 |
| LicenseSpring | 1 | 4 | 2 | 2 | 3 | 4 | 16 |

Bill score 2 is the interval between the rubric's under-ten-thousand and twenty-thousand anchors. Finout's [current pricing](https://www.finout.io/pricing) is private; old aggregator figures were not accepted. LicenseSpring's [pricing](https://licensespring.com/pricing) lists Business Plus at USD 750 per month, below five figures annually in USD. Its licensing runtime also makes a single-session replacement harder.

Buyer fit is conservative. A local delivery record confirms that managed cloud budgets and monthly reporting matter to an existing NZ professional-services buyer. No customer name, spend, vendor use or live CRM invoice is published. No direct Vantage customer invoice was verified. This is a candidate-selection limitation.

Search scores reflect the presence of competing alternative articles, not measured search volumes. Search results included [Amnic's Vantage alternatives article](https://amnic.com/blogs/vantage-alternatives) and [Costory's comparison](https://www.costory.io/compare/alternative-vantage). They are demand signals, not pricing or product authorities.

## Build scope and truthful comparison

[Vantage Cost Reports](https://docs.vantage.sh/cost_reports/) documents CSV export with the FOCUS schema and daily bins. [FOCUS](https://focus.finops.org/docs/specification/v1-2/) and [Microsoft's FOCUS metadata](https://learn.microsoft.com/en-us/cloud-computing/finops/focus/metadata) define the cost columns and exclusive end. The importer supports the stated daily subset, stores every original field and rejects unsupported periods or decimals.

Vantage already offers reporting, allocation, forecasts, unit costs, exports and custom analysis. This build makes no claim that Vantage cannot answer the ten demonstration questions. Its distinction is owning and changing the data model, with local review evidence beside costs. Live collection, infrastructure automation, commitment optimisation and equivalent access controls are not claimed. The free version remains useful offline without OAuth or a front end.

Compliance sources and implementation limits are in compliance.md. The FOCUS CSV fixture and seed are fictional. Page demonstrations are captured from actual command runs against that seed.
