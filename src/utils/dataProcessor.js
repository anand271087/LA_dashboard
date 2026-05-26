import Papa from 'papaparse'

// ============================================================================
// Helpers
// ============================================================================
const num = v => {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(/[, ₹$]/g, ''))
  return Number.isFinite(n) ? n : 0
}
const int = v => {
  if (v === null || v === undefined || v === '') return 0
  const n = parseInt(String(v).replace(/[, ]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}
const str = v => (v === null || v === undefined) ? '' : String(v).trim()

const allIdx = (headers, name) =>
  headers.reduce((acc, h, i) => h && h.toLowerCase().trim() === name.toLowerCase() ? [...acc, i] : acc, [])

const firstIdx = (headers, ...names) => {
  for (const name of names) {
    const idx = headers.findIndex(h => h && h.toLowerCase().trim() === name.toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

// ============================================================================
// Product categorization
// ============================================================================
export const categorize = name => {
  const s = (name || '').toLowerCase()
  if (!s) return 'Other'
  if (/shampoo|conditioner|hair/.test(s)) return 'Hair Care'
  if (/soap base|soap type/.test(s)) return 'Soap Bases'
  if (/face|facewash|lotion|cream|moistur|sunscreen|aloe/.test(s)) return 'Skin Care'
  if (/oil|butter|ghee/.test(s)) return 'Oils & Butters'
  if (/powder|petal|herb|neem|amla|henna|hibiscus|extract/.test(s)) return 'Botanicals'
  if (/fragrance|essential|aroma|scent|perfume/.test(s)) return 'Fragrances'
  if (/jar|bottle|box|mould|tube|ph strip|cutter|spatula/.test(s)) return 'Packaging & Tools'
  if (/sodium|glycerin|betaine|capb|sci-|sles|vitamin|phenoxy|edta|preservative|acid/.test(s)) return 'Chemicals & Actives'
  return 'Other'
}

// ============================================================================
// CSV parsing — positional, never key-based (handles duplicate columns)
// ============================================================================
export const parseCSV = file =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: results => {
        try {
          const all = results.data
          if (!all || all.length < 2) {
            reject(new Error('CSV is empty or has no data rows'))
            return
          }
          const headers = all[0].map(h => str(h))
          const rows = all.slice(1).filter(r => r.some(v => str(v) !== ''))
          resolve(processRawData({ headers, rows }))
        } catch (err) {
          reject(err)
        }
      },
      error: err => reject(err),
    })
  })

// ============================================================================
// Core processing — positional column mapping
// ============================================================================
export const processRawData = ({ headers, rows }) => {
  // Handle duplicate weight columns (Ecwid quirk: col 6 numeric kg, col 16 option label)
  const weightPositions = allIdx(headers, 'weight')

  const COL = {
    order:        firstIdx(headers, 'order_number', 'order number', 'order id', 'order_id'),
    paymentStatus:firstIdx(headers, 'payment_status', 'payment status'),
    orderTotal:   firstIdx(headers, 'order_total', 'order total', 'total'),
    orderTax:     firstIdx(headers, 'order_tax', 'order tax', 'tax'),
    orderShipping:firstIdx(headers, 'order_shipping', 'order shipping', 'shipping_cost', 'shipping'),
    discount:     firstIdx(headers, 'discount', 'order_discount', 'discount_amount'),
    couponCode:   firstIdx(headers, 'coupon_code', 'coupon code', 'coupon'),
    paymentMethod:firstIdx(headers, 'payment_method', 'payment method'),
    fulfilStatus: firstIdx(headers, 'fulfillment_status', 'fulfillment status', 'shipping_status'),
    shipMethod:   firstIdx(headers, 'shipping_method', 'shipping method'),
    date:         firstIdx(headers, 'created', 'order_date', 'date', 'paid_date', 'completed_date'),
    email:        firstIdx(headers, 'email', 'customer_email', 'customer email', 'billing_email'),
    firstName:    firstIdx(headers, 'customer_first_name', 'first_name', 'billing_first_name'),
    lastName:     firstIdx(headers, 'customer_last_name', 'last_name', 'billing_last_name'),
    acceptMkt:    firstIdx(headers, 'accept_marketing', 'accepts_marketing', 'marketing_opt_in'),
    state:        firstIdx(headers, 'shipping_state', 'billing_state', 'customer_state', 'state'),
    numWeight:    weightPositions[0] ?? -1,
    optWeight:    weightPositions[1] ?? -1,
    productName:  firstIdx(headers, 'product_name', 'item_name', 'name', 'product'),
    sku:          firstIdx(headers, 'sku', 'product_sku', 'item_sku'),
    qty:          firstIdx(headers, 'quantity', 'qty', 'item_quantity'),
    price:        firstIdx(headers, 'price', 'item_price', 'unit_price'),
    lineTotal:    firstIdx(headers, 'total', 'item_total', 'line_total'),
    lineTotalNoTax:firstIdx(headers, 'total_without_tax', 'total_no_tax', 'item_total_without_tax'),
  }

  const get = (row, idx) => idx >= 0 ? row[idx] : ''

  // ---- Order-level deduplication (first row wins) ----
  const orderMap = {}
  rows.forEach(r => {
    const id = str(get(r, COL.order))
    if (!id) return
    if (!orderMap[id]) orderMap[id] = r
  })
  const orders = Object.values(orderMap)

  // ---- Order KPIs ----
  const isPaid = r => str(get(r, COL.paymentStatus)).toLowerCase() === 'paid'
  const isCancelled = r => /cancel/i.test(str(get(r, COL.paymentStatus)))

  const paidOrders = orders.filter(isPaid)
  const cancelledOrders = orders.filter(isCancelled)

  const totalRevenue = paidOrders.reduce((s, r) => s + num(get(r, COL.orderTotal)), 0)
  const totalTax     = paidOrders.reduce((s, r) => s + num(get(r, COL.orderTax)), 0)
  const totalShipping= paidOrders.reduce((s, r) => s + num(get(r, COL.orderShipping)), 0)
  const totalDiscount= orders.reduce((s, r) => s + Math.abs(num(get(r, COL.discount))), 0)

  // ---- Customers (by email, across paid orders only) ----
  const customerMap = {}
  paidOrders.forEach(r => {
    const email = str(get(r, COL.email)).toLowerCase()
    if (!email) return
    const total = num(get(r, COL.orderTotal))
    if (!customerMap[email]) {
      customerMap[email] = {
        email,
        name: [str(get(r, COL.firstName)), str(get(r, COL.lastName))].filter(Boolean).join(' '),
        orderCount: 0,
        revenue: 0,
        lastOrder: '',
      }
    }
    customerMap[email].orderCount += 1
    customerMap[email].revenue += total
    const d = str(get(r, COL.date))
    if (d > customerMap[email].lastOrder) customerMap[email].lastOrder = d
  })
  const customers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue)
  const repeatCustomers = customers.filter(c => c.orderCount > 1).length
  const mktOptIn = orders.filter(r => /^(true|yes|1)$/i.test(str(get(r, COL.acceptMkt)))).length

  // ---- Coupons ----
  const couponMap = {}
  orders.forEach(r => {
    const code = str(get(r, COL.couponCode))
    if (!code) return
    if (!couponMap[code]) couponMap[code] = { code, orders: 0, discount: 0, revenue: 0 }
    couponMap[code].orders += 1
    couponMap[code].discount += Math.abs(num(get(r, COL.discount)))
    couponMap[code].revenue += num(get(r, COL.orderTotal))
  })
  const couponOrderCount = orders.filter(r => str(get(r, COL.couponCode))).length

  // ---- Payment / fulfillment / shipping / state breakdowns ----
  const tally = (idx, source = orders) => {
    const map = {}
    source.forEach(r => {
      const k = str(get(r, idx)) || '—'
      if (!map[k]) map[k] = { label: k, count: 0, revenue: 0 }
      map[k].count += 1
      map[k].revenue += num(get(r, COL.orderTotal))
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }
  const payMethods  = tally(COL.paymentMethod, paidOrders)
  const fulMap      = tally(COL.fulfilStatus)
  const shipMethods = tally(COL.shipMethod, paidOrders)
  const stateMap    = tally(COL.state, paidOrders)

  // ---- Daily revenue ----
  const byDateMap = {}
  paidOrders.forEach(r => {
    const raw = str(get(r, COL.date))
    if (!raw) return
    const d = raw.slice(0, 10) // YYYY-MM-DD prefix
    if (!byDateMap[d]) byDateMap[d] = { date: d, revenue: 0, orders: 0 }
    byDateMap[d].revenue += num(get(r, COL.orderTotal))
    byDateMap[d].orders  += 1
  })
  const byDate = Object.values(byDateMap).sort((a, b) => a.date.localeCompare(b.date))

  // ---- SKU & Product line-item aggregation (across ALL rows) ----
  const skuMap = {}
  const productMap = {}
  rows.forEach(r => {
    const sku  = str(get(r, COL.sku))
    const name = str(get(r, COL.productName))
    const qty  = int(get(r, COL.qty)) || 1
    const price= num(get(r, COL.price))
    const lineTotal = num(get(r, COL.lineTotal))
    const lineTotalNoTax = num(get(r, COL.lineTotalNoTax))
    const orderId = str(get(r, COL.order))
    const email = str(get(r, COL.email)).toLowerCase()

    const upsert = (map, key, displayName) => {
      if (!key) return
      if (!map[key]) {
        map[key] = {
          key,
          name: displayName,
          sku: sku || key,
          category: categorize(displayName || key),
          qty: 0,
          revenue: 0,
          revenueNoTax: 0,
          prices: [],
          orderSet: new Set(),
          customerSet: new Set(),
        }
      }
      const e = map[key]
      e.qty += qty
      e.revenue += lineTotal
      e.revenueNoTax += lineTotalNoTax
      if (price > 0) e.prices.push(price)
      if (orderId) e.orderSet.add(orderId)
      if (email) e.customerSet.add(email)
    }
    if (sku)  upsert(skuMap, sku, name || sku)
    if (name) upsert(productMap, name, name)
  })

  const finalize = entry => {
    const prices = entry.prices
    const orderCount = entry.orderSet.size
    const customerCount = entry.customerSet.size
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    return {
      key: entry.key,
      name: entry.name,
      sku: entry.sku,
      category: entry.category,
      qty: entry.qty,
      revenue: entry.revenue,
      revenueNoTax: entry.revenueNoTax,
      avgPrice,
      minPrice,
      maxPrice,
      orderCount,
      customerCount,
      revenuePerOrder: orderCount ? entry.revenue / orderCount : 0,
      revenuePerUnit:  entry.qty ? entry.revenue / entry.qty : 0,
    }
  }

  const skus     = Object.values(skuMap).map(finalize).sort((a, b) => b.revenue - a.revenue)
  const products = Object.values(productMap).map(finalize).sort((a, b) => b.revenue - a.revenue)

  // ---- Category breakdown (from products) ----
  const catMap = {}
  products.forEach(p => {
    if (!catMap[p.category]) catMap[p.category] = { label: p.category, revenue: 0, qty: 0, products: 0 }
    catMap[p.category].revenue += p.revenue
    catMap[p.category].qty     += p.qty
    catMap[p.category].products+= 1
  })
  const categoryData = Object.values(catMap).sort((a, b) => b.revenue - a.revenue)

  // ---- Summary KPIs ----
  const totalOrders = orders.length
  const kpis = {
    totalOrders,
    paidOrders: paidOrders.length,
    cancelledOrders: cancelledOrders.length,
    cancellationRate: totalOrders ? (cancelledOrders.length / totalOrders) * 100 : 0,
    totalRevenue,
    totalTax,
    totalShipping,
    netRevenue: totalRevenue - totalTax - totalShipping,
    aov: paidOrders.length ? totalRevenue / paidOrders.length : 0,
    taxPct: totalRevenue ? (totalTax / totalRevenue) * 100 : 0,
    totalDiscount,
    discountPct: totalRevenue ? (totalDiscount / totalRevenue) * 100 : 0,
    couponOrderCount,
    couponRate: totalOrders ? (couponOrderCount / totalOrders) * 100 : 0,
    uniqueCustomers: customers.length,
    repeatCustomers,
    repeatRate: customers.length ? (repeatCustomers / customers.length) * 100 : 0,
    mktOptIn,
    totalSkus: skus.length,
    totalProducts: products.length,
    totalUnits: skus.reduce((s, x) => s + x.qty, 0),
    dateRange: byDate.length
      ? { from: byDate[0].date, to: byDate[byDate.length - 1].date, days: byDate.length }
      : { from: '', to: '', days: 0 },
  }

  return {
    headers,
    orders,
    orderMap,
    skus,
    products,
    customers,
    couponMap: Object.values(couponMap).sort((a, b) => b.orders - a.orders),
    payMethods,
    fulMap,
    shipMethods,
    stateMap,
    byDate,
    categoryData,
    kpis,
  }
}

// ============================================================================
// Formatters
// ============================================================================
export const fmt  = n => '₹' + Number((n || 0).toFixed(0)).toLocaleString('en-IN')
export const fmtK = n => {
  const v = n || 0
  if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + 'L'
  if (v >= 1000)   return '₹' + (v / 1000).toFixed(1) + 'K'
  return '₹' + Math.round(v)
}
export const pct = n => (n || 0).toFixed(1) + '%'
export const numFmt = n => Number((n || 0).toFixed(0)).toLocaleString('en-IN')
