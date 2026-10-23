# Record checks and their sources

Checked 23 October 2026. These checks support a human review. They do not certify compliance, validate an invoice, or change cloud infrastructure.

| Rule | Implemented check | Authority and limit |
|---|---|---|
| Allocation | Every imported provider/account pair has a recorded cost owner or appears as unallocated. Shares must total exactly 100 percent. | [FinOps Foundation allocation capability](https://www.finops.org/framework/capabilities/allocation/). Operational framework, not a law. |
| Cost basis | Preserve billed and effective costs separately, including credits. Never add different currencies together. | [FOCUS specification 1.2](https://focus.finops.org/docs/specification/v1-2/). Import validates the supported daily subset, not full FOCUS conformance. |
| Period boundary | Daily UTC start is inclusive and end is exclusive. Reject other intervals and unsupported timestamps. | [Microsoft FOCUS metadata](https://learn.microsoft.com/en-us/cloud-computing/finops/focus/metadata). A stricter supported import profile, not a requirement that every FOCUS file be daily. |
| Personal information | Each centre has a stated purpose and a review date. Missing or overdue reviews are flagged. | [NZ Privacy Act principle 9](https://www.privacy.org.nz/privacy-principles/9/). Personal information should not be kept beyond its lawful purpose. Review dates are operator policy, not statutory deadlines. No automatic deletion. |
| Accountability | A centre has an owner; overdue investigations remain visible until an operator closes them with evidence. | Local operating policy informed by the FinOps allocation framework. |
| Budget | Missing monthly budgets are surfaced separately from recorded zero budgets. | Local policy. Effective cost is the budget basis. Budgets are not payment authorisations. |
| Freshness | An import whose latest exclusive period end is older than three days is flagged. | Local policy, adjustable in a migration. File upload time is not proof that the charge data is current. |

The operator controls the database. Row level security and revoked public grants prevent accidental anonymous table access; the CLI uses an authorised owner connection. There is no tenant isolation or per-user permissions product here. Use a dedicated database and restricted machine access. An administrator can alter records and the audit log, so these are not tamper-proof records.

Account allocation changes apply retrospectively to all imported history. The activity record keeps the previous allocation. Export a review snapshot before changing an agreed allocation. Historical versioned allocation policies are customisation work.

Source files can contain personal information in names or tags. Import only the authorised report scope. The original columns are preserved in source_data, so apply retention and access rules to the database, exports, drafts and backups together. No cloud credentials are needed for the free offline workflow.
