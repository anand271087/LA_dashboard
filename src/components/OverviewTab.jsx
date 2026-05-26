import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  ShoppingCart, IndianRupee, TrendingUp, Users, Package, Percent, CreditCard, MapPin,
} from 'lucide-react'
import KPICard from './KPICard'
import { fmt, fmtK, pct, numFmt } from '../utils/dataProcessor'

const PIE = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']

export default function OverviewTab({ data }) {
  const { kpis, byDate, payMethods, stateMap, categoryData } = data

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard icon={IndianRupee} color="green"  label="Total Revenue"    value={fmtK(kpis.totalRevenue)} sub={`${kpis.paidOrders} paid orders`}/>
        <KPICard icon={ShoppingCart} color="blue"  label="Total Orders"     value={numFmt(kpis.totalOrders)} sub={`${kpis.cancelledOrders} cancelled`}/>
        <KPICard icon={TrendingUp}  color="purple" label="Avg Order Value"  value={fmt(kpis.aov)} sub={`Net: ${fmtK(kpis.netRevenue)}`}/>
        <KPICard icon={Users}       color="orange" label="Customers"        value={numFmt(kpis.uniqueCustomers)} sub={`${pct(kpis.repeatRate)} repeat`}/>
        <KPICard icon={Package}     color="teal"   label="Units Sold"       value={numFmt(kpis.totalUnits)} sub={`${kpis.totalProducts} products`}/>
        <KPICard icon={Percent}     color="pink"   label="Discount Given"   value={fmtK(kpis.totalDiscount)} sub={`${pct(kpis.discountPct)} of revenue`}/>
        <KPICard icon={CreditCard}  color="red"    label="Cancellation"     value={pct(kpis.cancellationRate)} sub={`${kpis.cancelledOrders} orders`}/>
        <KPICard icon={MapPin}      color="gray"   label="Tax Collected"    value={fmtK(kpis.totalTax)} sub={`${pct(kpis.taxPct)} of revenue`}/>
      </div>

      {kpis.dateRange.days > 0 && (
        <p className="text-xs text-gray-500 -mt-2">
          Date range: <span className="font-medium text-gray-700">{kpis.dateRange.from}</span> → <span className="font-medium text-gray-700">{kpis.dateRange.to}</span> ({kpis.dateRange.days} days with orders)
        </p>
      )}

      {/* Revenue trend */}
      {byDate.length > 1 && (
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd"/>
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}/>
              <Tooltip formatter={v => fmt(v)} labelStyle={{ color: '#111' }}/>
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category mix */}
        {categoryData.length > 0 && (
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="revenue" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]}/>)}
                </Pie>
                <Tooltip formatter={v => fmt(v)}/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Payment methods */}
        {payMethods.length > 0 && (
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Payment Methods</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={payMethods.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                <XAxis type="number" tick={{ fontSize: 11 }}/>
                <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }}/>
                <Tooltip formatter={(v, k) => k === 'revenue' ? fmt(v) : v}/>
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Geography */}
        {stateMap.length > 0 && (
          <div className="kpi-card lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders by State</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stateMap.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip formatter={(v, k) => k === 'revenue' ? fmt(v) : numFmt(v)}/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
                <Bar dataKey="count" name="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
