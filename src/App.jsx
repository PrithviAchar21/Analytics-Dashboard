import React, { useMemo, useState } from 'react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays,
  ChevronDown, Download, FilterX, LayoutDashboard, Menu, Search, ShoppingBag,
  Sparkles, TrendingUp, Users, Wallet, X
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import csvText from './data/orders.csv?raw';

const COLORS = ['#8178fa', '#41c6b7', '#f5ba66', '#ef7b9d', '#75a8ef'];
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const shortCurrency = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}k` : `₹${Math.round(n)}`;
const integer = new Intl.NumberFormat('en-IN');
const dateLabel = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// This is a deliberately small CSV parser for the included dataset (which contains no quoted commas).
function parseOrders(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const keys = header.split(',');
  return lines.filter(Boolean).map((line) => {
    const values = line.split(',');
    const obj = Object.fromEntries(keys.map((key, idx) => [key, values[idx]]));
    return { id: obj['Order ID'], date: obj['Order Date'], customer: obj['Customer ID'], category: obj['Product Category'], region: obj.Region, amount: Number(obj['Sales Amount']) };
  });
}
const ORDERS = parseOrders(csvText);
const unique = (key) => [...new Set(ORDERS.map((d) => d[key]))].sort();
const earliest = ORDERS.reduce((a, b) => a < b.date ? a : b.date, ORDERS[0].date);
const latest = ORDERS.reduce((a, b) => a > b.date ? a : b.date, ORDERS[0].date);

function TooltipCard({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><p className="font-semibold text-white mb-1">{label}</p>{payload.map((item, index) => <p key={index} style={{ color: item.color || '#a9a4ff' }}>{item.name}: {currency.format(item.value)}</p>)}</div>;
}
function KpiCard({ icon: Icon, label, value, caption, tone }) {
  return <div className="panel kpi-card">
    <div className="flex items-center justify-between gap-3"><span className="muted text-sm font-medium">{label}</span><span className={`kpi-icon ${tone}`}><Icon size={18}/></span></div>
    <div className="mt-3 text-[clamp(1.35rem,2.1vw,2rem)] font-bold tracking-tight text-white">{value}</div>
    <p className="mt-2 text-xs text-slate-400">{caption}</p>
  </div>;
}
function SelectField({ label, value, options, onChange }) {
  return <label className="field-wrap"><span className="field-label">{label}</span><span className="select-wrap"><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select><ChevronDown size={14}/></span></label>;
}
function App() {
  const [region, setRegion] = useState('All Regions');
  const [category, setCategory] = useState('All Categories');
  const [from, setFrom] = useState(earliest);
  const [to, setTo] = useState(latest);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const rangeError = from > to;

  const filtered = useMemo(() => rangeError ? [] : ORDERS.filter((r) =>
    (region === 'All Regions' || r.region === region) &&
    (category === 'All Categories' || r.category === category) &&
    r.date >= from && r.date <= to
  ), [region, category, from, to, rangeError]);

  const stats = useMemo(() => {
    const revenue = filtered.reduce((total, item) => total + item.amount, 0);
    return { revenue, orders: filtered.length, aov: filtered.length ? revenue / filtered.length : 0, customers: new Set(filtered.map((item) => item.customer)).size };
  }, [filtered]);

  const monthData = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => { const k = r.date.slice(0, 7); map.set(k, (map.get(k) || 0) + r.amount); });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, revenue]) => ({ month: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), revenue: Math.round(revenue) }));
  }, [filtered]);
  const categoryData = useMemo(() => unique('category').map(name => ({ name, revenue: Math.round(filtered.filter(d => d.category === name).reduce((s,d) => s+d.amount,0)) })), [filtered]);
  const regionData = useMemo(() => unique('region').map(name => ({ name, revenue: Math.round(filtered.filter(d => d.region === name).reduce((s,d) => s+d.amount,0)) })), [filtered]);
  const tableRows = useMemo(() => filtered.filter(r => [r.id,r.customer,r.region,r.category].some(v => v.toLowerCase().includes(search.toLowerCase()))), [filtered,search]);
  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const currentPage = Math.min(page,totalPages);
  const reset = () => { setRegion('All Regions');setCategory('All Categories');setFrom(earliest);setTo(latest);setSearch('');setPage(1); };
  const exportCSV = () => {
    const heading = 'Order ID,Order Date,Customer ID,Product Category,Region,Sales Amount';
    const lines = filtered.map(r => `${r.id},${r.date},${r.customer},${r.category},${r.region},${r.amount.toFixed(2)}`);
    const blob = new Blob([[heading, ...lines].join('\n')], {type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='salespulse-filtered-orders.csv';link.click();URL.revokeObjectURL(url);
  };
  return <div className="app-shell">
    {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)}/>}
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="logo-row"><div className="logo-mark"><Activity size={21} strokeWidth={2.8}/></div><div><div className="text-white font-bold text-lg tracking-tight">SalesPulse<span className="text-violet-400">.</span></div><div className="text-[10px] tracking-[0.2em] uppercase text-slate-500">Analytics suite</div></div><button className="lg:hidden ml-auto text-slate-400" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={20}/></button></div>
      <div className="sidebar-section-label">Workspace</div>
      <nav aria-label="Main navigation"><a href="#overview" className="nav-link active" onClick={() => setSidebarOpen(false)}><LayoutDashboard size={18}/> Overview <span className="ml-auto tiny-dot"/></a><a href="#trends" className="nav-link" onClick={() => setSidebarOpen(false)}><TrendingUp size={18}/> Sales trends</a><a href="#transactions" className="nav-link" onClick={() => setSidebarOpen(false)}><ShoppingBag size={18}/> Transactions</a></nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><div className="flex items-center gap-2 text-violet-200 font-semibold text-sm"><Sparkles size={16}/> Insight at a glance</div><p className="text-xs text-slate-400 mt-2 leading-relaxed">Explore orders, revenue and customers across your business.</p></div><div className="flex items-center gap-3 mt-5"><div className="profile-bubble">SA</div><div><p className="text-sm font-medium text-slate-200">Sales Analyst</p><p className="text-xs text-slate-500">Demo workspace</p></div></div></div>
    </aside>
    <main className="main" id="overview">
      <header className="topbar"><div className="flex items-center gap-3"><button className="menu-btn lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21}/></button><span className="text-slate-400 text-sm">Workspace</span><span className="text-slate-600">/</span><span className="text-slate-200 font-medium text-sm">Overview</span></div><div className="topbar-right"><span className="status-indicator"/><span>Demo data</span><span className="hidden sm:inline text-slate-600 mx-1">•</span><span className="hidden sm:inline">Updated locally</span></div></header>
      <div className="content-container">
        <div className="hero-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> SALES INTELLIGENCE</div><h1>Sales Overview<span className="text-violet-400">.</span></h1><p className="text-slate-400 mt-2 text-sm sm:text-base">A clearer view of your business performance.</p></div><button className="primary-btn" onClick={exportCSV}><Download size={16}/> <span>Export report</span></button></div>
        <section className="filter-panel" aria-label="Dashboard filters"><div className="filter-title"><span className="filter-icon"><CalendarDays size={18}/></span><div><p className="text-white text-sm font-semibold">Filters</p><p className="text-slate-500 text-xs">Refine your view</p></div></div><div className="filter-grid"><SelectField label="REGION" value={region} onChange={v=>{setRegion(v);setPage(1)}} options={['All Regions',...unique('region')]}/><SelectField label="CATEGORY" value={category} onChange={v=>{setCategory(v);setPage(1)}} options={['All Categories',...unique('category')]}/><label className="field-wrap"><span className="field-label">FROM</span><input aria-label="From date" type="date" value={from} min={earliest} max={latest} onChange={e=>{setFrom(e.target.value);setPage(1)}}/></label><label className="field-wrap"><span className="field-label">TO</span><input aria-label="To date" type="date" value={to} min={earliest} max={latest} onChange={e=>{setTo(e.target.value);setPage(1)}}/></label></div><button className="reset-btn" onClick={reset} title="Reset all filters"><FilterX size={17}/><span>Reset</span></button></section>
        {rangeError && <div className="warning">The start date cannot be later than the end date. Please update your filters.</div>}
        <div className="section-heading"><div><p className="section-kicker">PERFORMANCE SNAPSHOT</p><h2>Key metrics</h2></div><div className="count-pill">{integer.format(filtered.length)} matching orders</div></div>
        <section className="kpi-grid" aria-label="Key performance indicators"><KpiCard icon={Wallet} label="Total Revenue" value={currency.format(stats.revenue)} caption="Sum of sales amount" tone="violet"/><KpiCard icon={ShoppingBag} label="Total Orders" value={integer.format(stats.orders)} caption="Orders in selected period" tone="teal"/><KpiCard icon={BarChart3} label="Average Order Value" value={currency.format(stats.aov)} caption="Revenue divided by orders" tone="amber"/><KpiCard icon={Users} label="Total Customers" value={integer.format(stats.customers)} caption="Unique customer IDs" tone="rose"/></section>
        <div className="section-heading" id="trends"><div><p className="section-kicker">REVENUE ANALYSIS</p><h2>Trends & performance</h2></div></div>
        <section className="charts-grid"><div className="panel chart-panel"><div className="chart-head"><div><h3>Revenue over time</h3><p>Monthly revenue trend</p></div><span className="chart-head-icon"><TrendingUp size={17}/></span></div>{monthData.length ? <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthData} margin={{top:12,right:6,left:-15,bottom:0}}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#897ff9" stopOpacity={0.32}/><stop offset="96%" stopColor="#897ff9" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#263047" vertical={false} strokeDasharray="3 5"/><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fill:'#8390a7',fontSize:11}} minTickGap={22}/><YAxis tickLine={false} axisLine={false} tick={{fill:'#8390a7',fontSize:11}} tickFormatter={shortCurrency}/><Tooltip content={<TooltipCard/>}/><Area type="monotone" dataKey="revenue" name="Revenue" stroke="#9187ff" strokeWidth={3} fill="url(#revenueFill)" activeDot={{r:5,fill:'#9187ff',stroke:'#171c2c',strokeWidth:3}}/></AreaChart></ResponsiveContainer></div> : <EmptyChart/>}</div>
          <div className="panel chart-panel"><div className="chart-head"><div><h3>Sales by category</h3><p>Revenue across product categories</p></div><span className="chart-head-icon"><BarChart3 size={17}/></span></div>{filtered.length ? <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical" margin={{top:4,right:12,left:12,bottom:0}}><CartesianGrid stroke="#263047" horizontal={false} strokeDasharray="3 5"/><XAxis type="number" tickLine={false} axisLine={false} tick={{fill:'#8390a7',fontSize:11}} tickFormatter={shortCurrency}/><YAxis type="category" dataKey="name" width={95} tickLine={false} axisLine={false} tick={{fill:'#c2c9d7',fontSize:11}}/><Tooltip cursor={{fill:'rgba(255,255,255,.025)'}} content={<TooltipCard/>}/><Bar dataKey="revenue" name="Revenue" radius={[0,5,5,0]} maxBarSize={27}>{categoryData.map((_,i)=><Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div> : <EmptyChart/>}</div></section>
        <section className="panel region-panel"><div className="chart-head"><div><h3>Regional performance</h3><p>Where your revenue comes from</p></div><span className="chart-head-icon"><Activity size={17}/></span></div>{filtered.length ? <div className="region-rows">{regionData.map((r,i) => <div className="region-row" key={r.name}><div className="region-name"><span className="region-dot" style={{background:COLORS[i]}}/>{r.name}</div><div className="region-track"><div className="region-fill" style={{width:`${stats.revenue ? r.revenue / stats.revenue * 100:0}%`,background:COLORS[i]}}/></div><div className="region-value">{shortCurrency(r.revenue)}</div><div className="region-share">{stats.revenue ? (r.revenue / stats.revenue * 100).toFixed(1) : '0'}%</div></div>)}</div> : <EmptyChart/>}</section>
        <section className="panel table-panel" id="transactions"><div className="table-header"><div><h3>Recent transactions</h3><p>Detailed view of your filtered sales</p></div><label className="table-search"><Search size={16}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search orders..." aria-label="Search orders"/></label></div><div className="table-scroll"><table><thead><tr><th>ORDER ID</th><th>DATE</th><th>CUSTOMER</th><th>CATEGORY</th><th>REGION</th><th className="amount-cell">SALES AMOUNT</th></tr></thead><tbody>{tableRows.slice((currentPage-1)*pageSize,currentPage*pageSize).map(r=><tr key={r.id}><td className="id-cell">{r.id}</td><td>{dateLabel(r.date)}</td><td>{r.customer}</td><td><span className="category-chip">{r.category}</span></td><td>{r.region}</td><td className="amount-cell amount-value">{currency.format(r.amount)}</td></tr>)}{!tableRows.length && <tr><td colSpan="6" className="table-empty">No orders match the selected filters.</td></tr>}</tbody></table></div><div className="table-footer"><span>Showing {tableRows.length ? (currentPage-1)*pageSize+1 : 0}–{Math.min(currentPage*pageSize,tableRows.length)} of {integer.format(tableRows.length)} orders</span><div className="pagination"><button disabled={currentPage<=1} onClick={()=>setPage(p=>p-1)} aria-label="Previous page">Previous</button><span>{currentPage} / {totalPages}</span><button disabled={currentPage>=totalPages} onClick={()=>setPage(p=>p+1)} aria-label="Next page">Next <ArrowRight size={13}/></button></div></div></section>
        <footer className="footer"><span>© 2026 SalesPulse · Analytics Dashboard</span><span>Built with React + Recharts · Synthetic sample data</span></footer>
      </div>
    </main>
  </div>;
}
function EmptyChart(){return <div className="empty-chart"><BarChart3 size={27}/><p>No data for the selected filters</p><span>Try adjusting your date, region or category.</span></div>}
export default App;
