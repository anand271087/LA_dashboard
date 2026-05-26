import { useState } from 'react'
import {
  LayoutDashboard, Package, Box, IndianRupee, Users, Tag, Menu, X, Upload as UploadIcon, FileText,
} from 'lucide-react'
import Upload from './components/Upload'
import OverviewTab from './components/OverviewTab'
import SKUTable from './components/SKUTable'
import ProductTable from './components/ProductTable'
import { FinancialsTab, CustomersTab, DiscountsTab } from './components/OtherTabs'

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'skus',       label: 'SKUs',       icon: Box },
  { id: 'products',   label: 'Products',   icon: Package },
  { id: 'financials', label: 'Financials', icon: IndianRupee },
  { id: 'customers',  label: 'Customers',  icon: Users },
  { id: 'discounts',  label: 'Discounts',  icon: Tag },
]

export default function App() {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!data) return <Upload onData={setData}/>

  const reset = () => { setData(null); setTab('overview'); setMobileOpen(false) }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5"/>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-sm md:text-base truncate">Order Insights Dashboard</h1>
              <p className="text-xs text-gray-500 truncate">
                {data.orders.length} orders · {data.skus.length} SKUs · {data.kpis.dateRange.from || '—'} → {data.kpis.dateRange.to || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="btn-ghost flex items-center gap-2 text-xs md:text-sm">
              <UploadIcon className="w-4 h-4"/>
              <span className="hidden sm:inline">New CSV</span>
            </button>
            <button onClick={() => setMobileOpen(o => !o)} className="md:hidden tab-btn tab-btn-inactive border border-gray-300">
              {mobileOpen ? <X className="w-4 h-4"/> : <Menu className="w-4 h-4"/>}
            </button>
          </div>
        </div>

        {/* Desktop tab bar */}
        <nav className="hidden md:block max-w-7xl mx-auto px-4 pb-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`tab-btn ${tab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                  <Icon className="w-4 h-4"/>
                  {t.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1">
              {TABS.map(t => {
                const Icon = t.icon
                return (
                  <button key={t.id} onClick={() => { setTab(t.id); setMobileOpen(false) }}
                    className={`tab-btn ${tab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'} justify-start`}>
                    <Icon className="w-4 h-4"/>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {tab === 'overview'   && <OverviewTab   data={data}/>}
        {tab === 'skus'       && <SKUTable      data={data}/>}
        {tab === 'products'   && <ProductTable  data={data}/>}
        {tab === 'financials' && <FinancialsTab data={data}/>}
        {tab === 'customers'  && <CustomersTab  data={data}/>}
        {tab === 'discounts'  && <DiscountsTab  data={data}/>}
      </main>

      <footer className="border-t border-gray-200 bg-white py-3 px-4 text-center text-xs text-gray-500">
        All processing happens locally in your browser · No data leaves your device
      </footer>
    </div>
  )
}
