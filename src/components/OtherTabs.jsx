import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { IndianRupee, TrendingUp, Percent, Users, Mail, Repeat, Tag, Ticket } from 'lucide-react'
import KPICard from './KPICard'
import { fmt, fmtK, pct, numFmt } from '../utils/dataProcessor'

const PIE = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

// ============================================================================
// Financials
// ============================================================================
export function FinancialsTab({ data }) {
  const { kpis, fulMap, shipMethods } = data

  const breakdown = [
    { label: 'Net Revenue', value: kpis.netRevenue },
    { label: 'Tax',         value: kpis.totalTax },
    { label: 'Shipping',    value: kpis.totalShipping },
    { label: 'Discounts',   value: kpis.totalDiscount },
  ].filter(b => b.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard icon={IndianRupee} color="green"  label="Gross Revenue" value={fmtK(kpis.totalRevenue)} sub={`${kpis.paidOrders} paid orders`}/>
        <KPICard icon={TrendingUp}  color="blue"   label="Net Revenue"   value={fmtK(kpis.netRevenue)}   sub="Excl. tax & shipping"/>
        <KPICard icon={Percent}     color="orange" label="Tax Collected" value={fmtK(kpis.totalTax)}     sub={`${pct(kpis.taxPct)} of gross`}/>
        <KPICard icon={IndianRupee} color="purple" label="Shipping"      value={fmtK(kpis.totalShipping)} sub="Collected"/>
        <KPICard icon={Percent}     color="red"    label="Discounts"     value={fmtK(kpis.totalDiscount)} sub={`${pct(kpis.discountPct)} of gross`}/>
        <KPICard icon={TrendingUp}  color="teal"   label="AOV"           value={fmt(kpis.aov)} sub={`${kpis.paidOrders} paid orders`}/>
        <KPICard icon={Percent}     color="pink"   label="Cancel rate"   value={pct(kpis.cancellationRate)} sub={`${kpis.cancelledOrders} cancelled`}/>
        <KPICard icon={IndianRupee} color="gray"   label="Total Orders"  value={numFmt(kpis.totalOrders)} sub="All statuses"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {breakdown.length > 0 && (
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="label" outerRadius={90} label>
                  {breakdown.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]}/>)}
                </Pie>
                <Tooltip formatter={v => fmt(v)}/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {fulMap.length > 0 && (
          <div className="kpi-card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Fulfillment Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fulMap}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                <XAxis dataKey="label" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip/>
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {shipMethods.length > 0 && (
          <div className="kpi-card lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Shipping Methods</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={shipMethods.slice(0, 10)} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                <XAxis type="number" tick={{ fontSize: 11 }}/>
                <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }}/>
                <Tooltip formatter={(v, k) => k === 'revenue' ? fmt(v) : v}/>
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Customers
// ============================================================================
export function CustomersTab({ data }) {
  const { kpis, customers } = data
  const top = useMemo(() => customers.slice(0, 20), [customers])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard icon={Users}  color="blue"   label="Unique Customers" value={numFmt(kpis.uniqueCustomers)} sub="By email"/>
        <KPICard icon={Repeat} color="green"  label="Repeat Buyers"    value={numFmt(kpis.repeatCustomers)} sub={`${pct(kpis.repeatRate)} repeat rate`}/>
        <KPICard icon={Mail}   color="purple" label="Marketing Opt-in" value={numFmt(kpis.mktOptIn)}        sub="Across orders"/>
        <KPICard icon={IndianRupee} color="orange" label="Avg Revenue / Customer" value={kpis.uniqueCustomers ? fmt(kpis.totalRevenue / kpis.uniqueCustomers) : '—'}/>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 20 Customers by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="th">#</th>
                <th className="th">Customer</th>
                <th className="th">Email</th>
                <th className="th text-right">Orders</th>
                <th className="th text-right">Revenue</th>
                <th className="th">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {top.map((c, i) => (
                <tr key={c.email} className="hover:bg-gray-50">
                  <td className="td text-gray-500">{i + 1}</td>
                  <td className="td font-medium">{c.name || '—'}</td>
                  <td className="td text-xs text-gray-500 max-w-[220px] truncate" title={c.email}>{c.email}</td>
                  <td className="td text-right">{c.orderCount}</td>
                  <td className="td text-right font-semibold">{fmt(c.revenue)}</td>
                  <td className="td text-xs text-gray-500">{c.lastOrder?.slice(0, 10) || '—'}</td>
                </tr>
              ))}
              {!top.length && (
                <tr><td className="td text-center text-gray-500 py-8" colSpan={6}>No customer data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Discounts
// ============================================================================
export function DiscountsTab({ data }) {
  const { kpis, couponMap } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KPICard icon={Percent} color="pink"   label="Total Discount" value={fmtK(kpis.totalDiscount)} sub={`${pct(kpis.discountPct)} of revenue`}/>
        <KPICard icon={Ticket}  color="orange" label="Coupon Orders"  value={numFmt(kpis.couponOrderCount)} sub={`${pct(kpis.couponRate)} of all orders`}/>
        <KPICard icon={Tag}     color="purple" label="Unique Coupons" value={numFmt(couponMap.length)}/>
        <KPICard icon={IndianRupee} color="teal" label="Avg Discount / Order" value={kpis.couponOrderCount ? fmt(kpis.totalDiscount / kpis.couponOrderCount) : '—'}/>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Coupons Used</h3>
        {couponMap.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No coupon usage recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="th">Code</th>
                  <th className="th text-right">Orders</th>
                  <th className="th text-right">Discount Given</th>
                  <th className="th text-right">Revenue Driven</th>
                  <th className="th text-right">Discount / Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {couponMap.map(c => (
                  <tr key={c.code} className="hover:bg-gray-50">
                    <td className="td font-mono text-sm">{c.code}</td>
                    <td className="td text-right">{c.orders}</td>
                    <td className="td text-right font-semibold text-pink-600">{fmt(c.discount)}</td>
                    <td className="td text-right">{fmt(c.revenue)}</td>
                    <td className="td text-right">{fmt(c.orders ? c.discount / c.orders : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
