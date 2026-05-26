import { useState, useMemo } from 'react'
import { Search, Filter, X, ArrowUpDown, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { fmt, fmtK, numFmt } from '../utils/dataProcessor'

const PER_PAGE = 20

export default function SKUTable({ data }) {
  const rowsAll = data.skus
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [minRevenue, setMinRevenue] = useState('')
  const [minQty, setMinQty] = useState('')
  const [sortCol, setSortCol] = useState('revenue')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const categories = useMemo(() => Array.from(new Set(rowsAll.map(r => r.category))).sort(), [rowsAll])

  const filtered = useMemo(() => {
    let rows = rowsAll
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.sku.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
    }
    if (category)   rows = rows.filter(r => r.category === category)
    if (minRevenue) rows = rows.filter(r => r.revenue >= parseFloat(minRevenue))
    if (minQty)     rows = rows.filter(r => r.qty >= parseInt(minQty, 10))

    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : (av - bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rowsAll, search, category, minRevenue, minQty, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const activeFilters = [search, category, minRevenue, minQty].filter(Boolean).length

  const clearFilters = () => { setSearch(''); setCategory(''); setMinRevenue(''); setMinQty(''); setPage(1) }
  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input-base pl-9" placeholder="Search SKU or product name…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/>
        </div>
        <button className={`tab-btn ${showFilters ? 'tab-btn-active' : 'tab-btn-inactive border border-gray-300'}`}
          onClick={() => setShowFilters(s => !s)}>
          <Filter className="w-4 h-4"/>
          Filters
          {activeFilters > 0 && <span className="badge !bg-white !text-blue-600">{activeFilters}</span>}
        </button>
        {activeFilters > 0 && (
          <button className="tab-btn tab-btn-inactive" onClick={clearFilters}>
            <X className="w-4 h-4"/>Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="kpi-card grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600 font-medium">Category</label>
            <select className="input-base mt-1" value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Min revenue (₹)</label>
            <input type="number" className="input-base mt-1" value={minRevenue}
              onChange={e => { setMinRevenue(e.target.value); setPage(1) }} placeholder="e.g. 1000"/>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Min quantity</label>
            <input type="number" className="input-base mt-1" value={minQty}
              onChange={e => { setMinQty(e.target.value); setPage(1) }} placeholder="e.g. 5"/>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {rowsAll.length} SKUs
      </p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <Th label="SKU"        col="sku"        sortCol={sortCol} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Product"    col="name"       sortCol={sortCol} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Category"   col="category"   sortCol={sortCol} sortDir={sortDir} onClick={toggleSort}/>
                <Th label="Qty"        col="qty"        sortCol={sortCol} sortDir={sortDir} onClick={toggleSort} right/>
                <Th label="Revenue"    col="revenue"    sortCol={sortCol} sortDir={sortDir} onClick={toggleSort} right/>
                <Th label="Avg Price"  col="avgPrice"   sortCol={sortCol} sortDir={sortDir} onClick={toggleSort} right/>
                <Th label="Orders"     col="orderCount" sortCol={sortCol} sortDir={sortDir} onClick={toggleSort} right/>
                <Th label="Customers"  col="customerCount" sortCol={sortCol} sortDir={sortDir} onClick={toggleSort} right/>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map(r => (
                <tr key={r.key} className="hover:bg-gray-50">
                  <td className="td font-mono text-xs text-gray-700">{r.sku}</td>
                  <td className="td max-w-[280px] truncate" title={r.name}>{r.name}</td>
                  <td className="td"><span className="badge">{r.category}</span></td>
                  <td className="td text-right">{numFmt(r.qty)}</td>
                  <td className="td text-right font-semibold text-gray-900">{fmt(r.revenue)}</td>
                  <td className="td text-right">{fmt(r.avgPrice)}</td>
                  <td className="td text-right">{numFmt(r.orderCount)}</td>
                  <td className="td text-right">{numFmt(r.customerCount)}</td>
                </tr>
              ))}
              {!pageRows.length && (
                <tr><td className="td text-center text-gray-500 py-8" colSpan={8}>No SKUs match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {pageRows.map(r => (
          <div key={r.key} className="kpi-card">
            <div className="flex justify-between gap-2 items-start">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-gray-500 truncate">{r.sku}</p>
                <p className="font-semibold text-gray-900 text-sm truncate" title={r.name}>{r.name}</p>
                <span className="badge mt-1"><Tag className="w-3 h-3 inline mr-1"/>{r.category}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">{fmtK(r.revenue)}</p>
                <p className="text-xs text-gray-500">{numFmt(r.qty)} units</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
              <div><p className="text-gray-500">Avg price</p><p className="font-semibold">{fmt(r.avgPrice)}</p></div>
              <div><p className="text-gray-500">Orders</p><p className="font-semibold">{numFmt(r.orderCount)}</p></div>
              <div><p className="text-gray-500">Buyers</p><p className="font-semibold">{numFmt(r.customerCount)}</p></div>
            </div>
          </div>
        ))}
        {!pageRows.length && <p className="text-center text-gray-500 py-8 text-sm">No SKUs match your filters</p>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button className="btn-ghost !px-3" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <button className="btn-ghost !px-3" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ label, col, sortCol, sortDir, onClick, right }) {
  const active = sortCol === col
  return (
    <th className={`th ${right ? 'text-right' : ''}`} onClick={() => onClick(col)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? 'text-blue-600' : 'text-gray-400'} ${active && sortDir === 'asc' ? 'rotate-180' : ''}`}/>
      </span>
    </th>
  )
}
