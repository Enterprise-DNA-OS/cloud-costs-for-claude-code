# Real demo command runs

Captured on 23 October 2026 from the fictional Kauri seed. These same outputs appear on the comparison page. Amounts carry the currency in a separate column.

## showback

```text
node scripts/costs.mjs showback
  month       centre       owner  currency  billed_amount  effective_amount
  ----------  -----------  -----  --------  -------------  ----------------
  2026-10-01  APP          Mara   USD       398            358             
  2026-10-01  OPS          Hemi   NZD       45             45              
  2026-10-01  OPS          Hemi   USD       72             72              
  2026-10-01  UNALLOCATED         USD       30             30
```

## budget-review

```text
node scripts/costs.mjs budget-review
  month       centre       currency  budget_amount  actual_amount  variance_amount  finding      
  ----------  -----------  --------  -------------  -------------  ---------------  -------------
  2026-10-01  APP          USD       100            358            258              over budget  
  2026-10-01  OPS          NZD       100            45             -55              within budget
  2026-10-01  OPS          USD       null           72             null             no budget    
  2026-10-01  UNALLOCATED  USD       null           30             null             no budget
```

## attention

```text
node scripts/costs.mjs attention
  rule            reference                       finding                                                 
  --------------  ------------------------------  --------------------------------------------------------
  accountability  LAB                             Cost centre has no owner                                
  allocation      Azure / sandbox                 Account has no allocation                               
  budget          OPS / 2026-10-01 / USD          No monthly budget recorded                              
  budget          UNALLOCATED / 2026-10-01 / USD  No monthly budget recorded                              
  follow_up       COST-01                         Open investigation is overdue                           
  privacy_review  LAB                             Purpose or personal-information review is missing or due
```

