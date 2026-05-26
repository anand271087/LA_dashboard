# CLAUDE.md — Order Insights Dashboard

## Project Overview
A mobile-first React + Tailwind SPA that lets users upload any Ecwid-format orders CSV
and instantly see KPI dashboards across SKUs, products, financials, customers, and discounts.
No backend. All parsing and computation happens in the browser.

---

## Tech Stack
| Layer | Tool |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 2 |
| CSV parsing | PapaParse 5 |
| Icons | lucide-react |
| Language | JSX (no TypeScript) |

---

## Commands
```bash
npm install       # install dependencies
npm run dev       # start dev server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

---

## Project Structure
```
csv-dashboard/
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx                   # React root mount
    ├── App.jsx                    # Top-level: tab nav, upload gate, routing
    ├── index.css                  # Tailwind directives + shared component classes
    ├── utils/
    │   └── dataProcessor.js       # ALL CSV parsing + KPI computation logic
    └── components/
        ├── Upload.jsx             # Drag-and-drop CSV uploader screen
        ├── KPICard.jsx            # Reusable summary metric card
        ├── OverviewTab.jsx        # Revenue trend, charts, geographic breakdown
        ├── SKUTable.jsx           # SKU-level table: search, filter, sort, paginate
        ├── ProductTable.jsx       # Product-level table: same UX as SKUTable
        └── OtherTabs.jsx          # FinancialsTab, CustomersTab, DiscountsTab
```

---

## Architecture Decisions

### CSV Parsing — positional, not key-based
The source CSV has a **duplicate `weight` column** (col 6 = numeric kg, col 16 = option
label like "100 GM"). PapaParse with `header: true` would clobber the first with the second.
We parse with `header: false` and map columns by position using the first row as headers.

```js
// In dataProcessor.js — always find positions dynamically
const allIdx = name => headers.reduce((a,h,i) => h===name ? [...a,i] : a, [])
const weightPositions = allIdx('weight')
const COL = {
  numWeight: weightPositions[0],  // numeric kg
  optWeight: weightPositions[1],  // e.g. "100 GM"
  // ... all other cols
}
```

**Rule: never use `r['weight']` directly. Always use positional COL indices.**

### Data Shape — line items, not orders
Each CSV row = one **line item**. Multiple rows share the same `order_number`.
- Use `orderMap` (keyed by order_number, first-row wins) for order-level financials.
- Use `skuMap` and `productMap` for item-level aggregation.
- Never sum `order_total` across all rows — that double-counts multi-item orders.

```js
// WRONG — double counts
rows.forEach(r => total += num(r[COL.orderTotal]))

// RIGHT — deduplicate first
const orderMap = {}
rows.forEach(r => { if (!orderMap[r[COL.order]]) orderMap[r[COL.order]] = r })
Object.values(orderMap).forEach(r => total += num(r[COL.orderTotal]))
```

### State Management
No Redux or Zustand. All state lives in `App.jsx` (active tab, parsed data).
Each tab component receives the full parsed `data` object as a prop and filters/sorts
locally with `useMemo`. This keeps components self-contained and fast.

---

## Data Flow
```
CSV file
  └─→ Upload.jsx (file input / drag-drop)
        └─→ parseCSV(file)  [dataProcessor.js]
              └─→ processRawData(raw)
                    ├─→ orderMap      (deduplicated orders)
                    ├─→ skuMap        (aggregated per SKU)
                    ├─→ productMap    (aggregated per product name)
                    ├─→ kpis          (summary numbers)
                    ├─→ byDate        (daily revenue + orders)
                    ├─→ categoryData  (revenue by product category)
                    ├─→ customers     (per-email aggregation)
                    ├─→ couponMap     (coupon usage)
                    └─→ payMethods / fulMap / shipMethods / stateMap
  └─→ App.jsx sets data state
        └─→ renders active tab with data prop
```

---

## KPIs Computed

### Order KPIs (`kpis` object)
| Key | Description |
|---|---|
| `totalOrders` | Count of unique order_number values |
| `paidOrders` | Orders where payment_status === 'Paid' |
| `cancelledOrders` | Orders where payment_status is Canceled/Cancelled |
| `cancellationRate` | cancelledOrders / totalOrders × 100 |
| `totalRevenue` | Sum of order_total for paid orders |
| `totalTax` | Sum of order_tax for paid orders |
| `totalShipping` | Sum of order_shipping for paid orders |
| `netRevenue` | totalRevenue − totalTax − totalShipping |
| `aov` | totalRevenue / paidOrders |
| `taxPct` | totalTax / totalRevenue × 100 |

### Discount KPIs
| Key | Description |
|---|---|
| `totalDiscount` | Sum of abs(discount) across all orders |
| `discountPct` | totalDiscount / totalRevenue × 100 |
| `couponOrderCount` | Orders with a non-empty coupon_code |
| `couponRate` | couponOrderCount / totalOrders × 100 |

### Customer KPIs
| Key | Description |
|---|---|
| `uniqueCustomers` | Distinct email addresses |
| `repeatCustomers` | Customers with more than 1 order |
| `repeatRate` | repeatCustomers / uniqueCustomers × 100 |
| `mktOptIn` | Orders where accept_marketing === 'true' |

### Product / SKU KPIs (per-item, on skus/products arrays)
| Field | Description |
|---|---|
| `qty` | Total units sold |
| `revenue` | Sum of line item totals |
| `revenueNoTax` | Sum of total_without_tax |
| `avgPrice` | Mean of all recorded prices |
| `minPrice` / `maxPrice` | Price range |
| `orderCount` | Unique orders containing this SKU/product |
| `customerCount` | Unique customers who bought it |
| `revenuePerOrder` | revenue / orderCount |
| `revenuePerUnit` | revenue / qty |

---

## Product Categorization (`categorize(name)`)
Located in `dataProcessor.js`. Maps product name → category string using regex.

| Category | Match pattern |
|---|---|
| Hair Care | shampoo, conditioner, hair |
| Soap Bases | soap base, soap type |
| Skin Care | face, facewash, lotion, cream, moistur, sunscreen, aloe |
| Oils & Butters | oil, butter, ghee |
| Botanicals | powder, petal, herb, neem, amla, henna, hibiscus, extract |
| Fragrances | fragrance, essential, aroma, scent, perfume |
| Packaging & Tools | jar, bottle, box, mould, tube, ph strip, cutter, spatula |
| Chemicals & Actives | sodium, glycerin, betaine, capb, sci-, sles, vitamin, phenoxy… |
| Other | fallback |

**To add a new category:** add a new `if` branch before the `return 'Other'` line.

---

## SKUTable & ProductTable — Filter/Sort Pattern
Both tables follow the same pattern. When extending:

1. Add a `useState` for the new filter value.
2. Add a filter input in the filter panel (only shown when `showFilters === true`).
3. Add a filter predicate inside the `useMemo` filtered array.
4. Increment `activeFilters` count.
5. Clear the new state in `clearFilters()`.

Sorting works by setting `sortCol` to any key present on the row object.
`useMemo` re-runs on any filter/sort state change — no manual re-fetching needed.

**Pagination:** `PER_PAGE = 20`. Changing this constant affects both desktop table and mobile cards.

---

## Tabs
| Tab ID | Component | Data used |
|---|---|---|
| `overview` | `OverviewTab` | kpis, byDate, payMethods, fulMap, stateMap, categoryData |
| `skus` | `SKUTable` | data.skus |
| `products` | `ProductTable` | data.products |
| `financials` | `FinancialsTab` | kpis, orders |
| `customers` | `CustomersTab` | kpis, customers, orders |
| `discounts` | `DiscountsTab` | kpis, couponMap, orders |

To add a new tab:
1. Add `{ id, label, icon }` to the `TABS` array in `App.jsx`.
2. Create the component (or add it to `OtherTabs.jsx`).
3. Add the render condition `{tab === 'newid' && <NewTab data={data}/>}` in `App.jsx`.

---

## Mobile Responsiveness
- Navigation: hamburger menu on `< md`, horizontal tab bar on `md+`.
- KPI grid: `grid-cols-2` on mobile, `grid-cols-3` or `grid-cols-4` on desktop.
- SKUTable / ProductTable: card layout on mobile (`md:hidden`), table on desktop (`hidden md:block`).
- Charts: all wrapped in `ResponsiveContainer width="100%"` — auto-resize.
- Touch targets: all buttons `min-h-[36px]`, filter pills `py-1 px-2.5`.

---

## Formatting Conventions
```js
const fmt  = n => '₹' + Number((n||0).toFixed(0)).toLocaleString('en-IN')  // ₹1,23,456
const fmtK = n => n >= 100000 ? '₹'+(n/100000).toFixed(2)+'L'             // ₹5.80L
               : n >= 1000   ? '₹'+(n/1000).toFixed(1)+'K'                // ₹1.2K
               : '₹'+Math.round(n||0)                                      // ₹648
const pct  = n => (n||0).toFixed(1)+'%'                                    // 10.9%
```

Always use `en-IN` locale for Indian number formatting (lakhs/crores).
Never display raw floats — always run through `fmt`, `fmtK`, or `.toFixed()`.

---

## CSS Classes (index.css)
```css
.kpi-card      /* white card with border + shadow */
.tab-btn       /* base tab button style */
.tab-btn-active
.tab-btn-inactive
.th            /* sortable table header */
.td            /* table data cell */
.badge         /* small inline label pill */
.input-base    /* text/number input */
.btn-primary   /* blue filled button */
.btn-ghost     /* outlined button */
```

---

## Common Pitfalls

1. **Don't use `r['weight']`** — use `r[COL.numWeight]` for numeric kg, `r[COL.optWeight]` for the label.
2. **Don't sum `order_total` from all rows** — always deduplicate by order_number first.
3. **Don't hardcode column indices** — always derive from `headers.indexOf()` or `allIdx()`.
4. **Charts need `ResponsiveContainer`** — never set fixed pixel widths on Recharts.
5. **Mobile cards vs desktop table** — when adding columns to the table, also update the mobile card layout in the same component.
6. **`parseInt`/`parseFloat` on empty strings return `NaN`** — always use the `num()` / `int()` helpers from dataProcessor, or guard with `|| 0`.

---

## Extending the Dashboard — Quick Reference

### Add a new KPI card to Overview
```jsx
// In OverviewTab.jsx, inside the KPI grid div:
<KPICard icon={SomeIcon} color="blue" label="My New KPI" value={fmtK(kpis.myValue)} sub="subtitle"/>
```

### Add a new computed KPI
```js
// In dataProcessor.js, inside the kpis object:
myValue: orders.reduce((s, o) => s + someCalc(o), 0),
```

### Add a new filter to SKUTable
```jsx
// 1. State
const [myFilter, setMyFilter] = useState('')

// 2. Filter panel input
<input className="input-base" value={myFilter} onChange={e => setMyFilter(e.target.value)}/>

// 3. Inside useMemo filtered array
if (myFilter) rows = rows.filter(r => r.someField >= parseFloat(myFilter))

// 4. clearFilters()
setMyFilter('')
```

### Add a new chart
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<div className="kpi-card">
  <h3 className="text-sm font-semibold text-gray-700 mb-4">Chart Title</h3>
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={yourData}>
      <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
      <YAxis tick={{ fontSize: 11 }}/>
      <Tooltip/>
      <Bar dataKey="value" fill="#3B82F6" radius={[4,4,0,0]}/>
    </BarChart>
  </ResponsiveContainer>
</div>
```
