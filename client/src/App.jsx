import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowLeft, ArrowRight, BookOpen, Bus, Check, ChevronDown, CircleDollarSign, CreditCard, Ellipsis, Film, HeartPulse, House, LoaderCircle, MoreHorizontal, Plus, Search, Sparkles, Trash2, Utensils, Wallet, X } from 'lucide-react';

const categories = ['Food', 'Transport', 'Study', 'Housing', 'Entertainment', 'Health', 'Other'];
const categoryIcons = { Food: Utensils, Transport: Bus, Study: BookOpen, Housing: House, Entertainment: Film, Health: HeartPulse, Other: Ellipsis };
const categoryColors = { Food: 'coral', Transport: 'blue', Study: 'violet', Housing: 'green', Entertainment: 'pink', Health: 'mint', Other: 'slate' };
const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const blank = () => ({ title: '', amount: '', category: 'Food', date: todayISO(), note: '', paymentMethod: 'UPI' });
async function api(url, options = {}) {
 const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
 if (!response.ok) { let data = {}; try { data = await response.json(); } catch {} throw new Error(data.message || `Request failed (${response.status})`); }
 return response.status === 204 ? null : response.json();
}
function money(amount, currency) {
 try { return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount || 0); }
 catch { return `${currency} ${Number(amount || 0).toFixed(2)}`; }
}
function monthTitle(key) { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
export default function App() {
 const [month, setMonth] = useState(() => monthKey(new Date()));
 const [expenses, setExpenses] = useState([]), [summary, setSummary] = useState({ total: 0, count: 0, categories: [] });
 const [search, setSearch] = useState(''), [categoryFilter, setCategoryFilter] = useState('All categories');
 const [loading, setLoading] = useState(true), [error, setError] = useState(''), [modal, setModal] = useState(false), [editing, setEditing] = useState(null);
 const [form, setForm] = useState(blank), [busy, setBusy] = useState(false), [toast, setToast] = useState('');
 const currency = 'INR';
 const load = useCallback(async () => {
  setLoading(true); setError('');
  try { const [records, totals] = await Promise.all([api(`/api/expenses?month=${month}`), api(`/api/expenses/summary?month=${month}`)]); setExpenses(records); setSummary(totals); }
  catch (e) { setError(e.message); }
  finally { setLoading(false); }
 }, [month]);
 useEffect(() => { load(); }, [load]);
 useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 2600); return () => clearTimeout(id); }, [toast]);
 const filtered = useMemo(() => expenses.filter(item => (categoryFilter === 'All categories' || item.category === categoryFilter) && (!search.trim() || `${item.title} ${item.note || ''} ${item.category}`.toLowerCase().includes(search.trim().toLowerCase()))), [expenses, categoryFilter, search]);
 const maxCategory = summary.categories[0];
 function moveMonth(amount) { const [year, value] = month.split('-').map(Number); setMonth(monthKey(new Date(year, value - 1 + amount, 1))); }
 function newExpense() { setEditing(null); setForm(blank()); setModal(true); }
 function editExpense(item) { setEditing(item); setForm({ title: item.title, amount: String(item.amount), category: item.category, date: item.date.slice(0, 10), note: item.note || '', paymentMethod: item.paymentMethod || 'UPI' }); setModal(true); }
 async function save(event) {
  event.preventDefault(); setBusy(true); setError('');
  try {
   const payload = { ...form, amount: Number(form.amount), date: new Date(`${form.date}T12:00:00`).toISOString() };
   const result = await api(editing ? `/api/expenses/${editing._id}` : '/api/expenses', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
   setModal(false); setToast(editing ? 'Expense updated' : 'Expense added');
   if (monthKey(new Date(result.date)) === month) await load(); else setMonth(monthKey(new Date(result.date)));
  } catch (e) { setError(e.message); } finally { setBusy(false); }
 }
 async function remove(item) {
  if (!window.confirm(`Delete “${item.title}” from your expenses?`)) return;
  try { await api(`/api/expenses/${item._id}`, { method: 'DELETE' }); setToast('Expense deleted'); await load(); }
  catch (e) { setError(e.message); }
 }
 return <div className="app-shell">
  <aside className="sidebar"><a className="brand" href="#home"><span className="brand-mark"><Wallet size={18}/></span><span>pennywise<span className="brand-dot">.</span></span></a>
   <div className="workspace"><span className="workspace-avatar">S</span><span><b>Student account</b><small>Personal finances</small></span><ChevronDown size={14}/></div>
   <div className="side-label">YOUR MONEY</div><nav className="nav-list"><button className="nav-item active"><CircleDollarSign size={17}/><span>Overview</span></button><div className="side-hint"><span className="hint-icon"><Sparkles size={14}/></span><b>Make every rupee count</b><p>Small spending habits add up. Keep an eye on where it goes.</p></div></nav>
   <div className="sidebar-bottom"><div className="budget-note"><span className="budget-icon"><Activity size={15}/></span><div><b>Mindful spending</b><p>Track today, thank yourself later.</p></div></div><div className="profile"><span className="profile-avatar">S</span><span><b>Student</b><small>Free account</small></span><MoreHorizontal size={17}/></div></div>
  </aside>
  <main className="main-area"><header className="topbar"><span className="crumb">My finances <i>/</i> <b>Overview</b></span><div className="top-actions"><span className="currency-picker">₹ &nbsp; INR</span><span className="top-avatar">S</span></div></header>
   <div className="content-wrap"><section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR STUDENT SPENDING</div><h1>Know where it goes.</h1><p className="welcome-sub">A clearer view of your money, one day at a time.</p></div><button className="primary-button" onClick={newExpense}><Plus size={16}/> Add expense</button></section>
    <div className="month-control"><button onClick={()=>moveMonth(-1)} aria-label="Previous month"><ArrowLeft size={15}/></button><strong>{monthTitle(month)}</strong><button onClick={()=>moveMonth(1)} aria-label="Next month"><ArrowRight size={15}/></button><button className="today-button" onClick={()=>setMonth(monthKey(new Date()))}>This month</button></div>
    <section className="summary-grid"><article className="summary-card total-card"><div className="summary-top"><span className="summary-icon green"><Wallet size={17}/></span><span className="summary-kicker">MONTHLY SPENDING</span></div><strong className="big-number">{money(summary.total,currency)}</strong><span className="summary-caption">Total expenses in {monthTitle(month)}</span><div className="total-footer"><span className="footer-check"><Check size={12}/></span> Every small expense is accounted for</div></article>
     <article className="summary-card"><div className="summary-top"><span className="summary-icon lavender"><ArrowDownLeft size={17}/></span><span className="summary-kicker">TRANSACTIONS</span></div><strong className="summary-number">{summary.count}</strong><span className="summary-caption">{summary.count===1?'expense recorded':'expenses recorded'}</span><div className="mini-bar">{Array.from({length:12},(_,i)=><i key={i} style={{height:`${summary.count?Math.max(16,Math.min(100,20+((i*29+summary.count*17)%72))):12}%`}}/>)}</div></article>
     <article className="summary-card"><div className="summary-top"><span className="summary-icon peach"><Sparkles size={17}/></span><span className="summary-kicker">TOP CATEGORY</span></div><strong className="category-top">{maxCategory?.['_id'] || '—'}</strong><span className="summary-caption">{maxCategory?`${money(maxCategory.amount,currency)} this month`:'No expenses yet'}</span><div className="top-category-footer">{maxCategory&&<><span className={`category-dot ${categoryColors[maxCategory._id]}`}/>{maxCategory.count} {maxCategory.count===1?'transaction':'transactions'}</>}</div></article>
    </section>
    <section className="insights-grid"><article className="insight-card"><div className="section-heading"><div><h2>Spending by category</h2><p>See what’s taking the biggest share.</p></div><span className="month-chip">{monthTitle(month).split(' ')[0]}</span></div>
      {summary.categories.length ? <div className="category-breakdown">{summary.categories.slice(0,5).map(item=>{const Icon=categoryIcons[item._id]||Ellipsis; const share=summary.total?Math.round(item.amount/summary.total*100):0; return <div className="category-row" key={item._id}><span className={`cat-icon ${categoryColors[item._id]}`}><Icon size={15}/></span><div className="cat-info"><div className="cat-head"><b>{item._id}</b><span>{money(item.amount,currency)} <small>{share}%</small></span></div><div className="bar-track"><i className={categoryColors[item._id]} style={{width:`${share}%`}}/></div></div></div>})}</div> : <div className="chart-empty"><span className="empty-orbit"><CircleDollarSign size={20}/></span><b>Your spending story starts here</b><span>Add a few expenses to see your category breakdown.</span></div>}
     </article>
     <article className="tip-card"><div className="tip-decoration"><span/><span/><span/></div><span className="tip-label"><Sparkles size={14}/> A LITTLE REMINDER</span><h3>Small spends count, too.</h3><p>A snack between lectures or a quick ride can seem tiny. Tracking the little things helps you make room for the big things.</p><div className="tip-bottom"><span className="tip-illustration"><Wallet size={18}/></span><span>Future you says thanks.</span></div></article>
    </section>
    <section className="transactions-panel"><div className="panel-heading"><div><h2>Recent expenses</h2><p>Your spending, all in one place.</p></div><span className="record-count">{filtered.length} {filtered.length===1?'record':'records'}</span></div>
     <div className="filters"><label className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses..." aria-label="Search expenses"/>{search&&<button onClick={()=>setSearch('')} aria-label="Clear search"><X size={14}/></button>}</label><label className="select-wrap"><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} aria-label="Filter category"><option>All categories</option>{categories.map(cat=><option key={cat}>{cat}</option>)}</select><ChevronDown size={13}/></label></div>
     {error&&<div className="error-banner" role="alert"><span>{error}</span><button onClick={()=>setError('')} aria-label="Dismiss"><X size={15}/></button></div>}
     {loading?<div className="empty-list"><LoaderCircle className="spin" size={22}/><span>Loading your expenses…</span></div>:filtered.length?<div className="expense-list">{filtered.map(item=><ExpenseRow key={item._id} item={item} currency={currency} onEdit={()=>editExpense(item)} onDelete={()=>remove(item)}/>)}</div>:<div className="empty-list"><span className="empty-icon"><Wallet size={22}/></span><b>{search||categoryFilter!=='All categories'?'No expenses match those filters':'Nothing spent yet this month'}</b><span>{search||categoryFilter!=='All categories'?'Try another search or category.':'Add your first expense to start seeing your spending clearly.'}</span>{!search&&categoryFilter==='All categories'&&<button className="secondary-button" onClick={newExpense}><Plus size={14}/> Add your first expense</button>}</div>}
    </section><footer className="footer-note"><span><Sparkles size={13}/> Made for student life</span><span>Little steps, better money habits.</span></footer>
   </div>
  </main>
  {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="expense-modal" onSubmit={save}><div className="modal-top"><span className="modal-icon"><Wallet size={17}/></span><button type="button" className="icon-button" onClick={()=>setModal(false)} aria-label="Close"><X size={18}/></button></div><h2>{editing?'Edit expense':'Add an expense'}</h2><p className="modal-sub">Keep track of where your money goes.</p><label className="form-label">What did you spend on? <em>*</em><input autoFocus maxLength={100} required placeholder="e.g. Lunch after class" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><div className="form-row"><label className="form-label">Amount ({currency}) <em>*</em><input type="number" min="0.01" max="10000000" step="0.01" required placeholder="0.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label><label className="form-label">Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(cat=><option key={cat}>{cat}</option>)}</select></label></div><div className="form-row"><label className="form-label">Date<input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label className="form-label">Paid with<select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}><option>UPI</option><option>Cash</option><option>Card</option><option>Other</option></select></label></div><label className="form-label">Note <span className="optional">Optional</span><textarea maxLength={500} rows={2} placeholder="Add a quick note..." value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>{error&&<div className="error-banner">{error}</div>}<div className="modal-actions"><button type="button" className="cancel-button" onClick={()=>setModal(false)}>Cancel</button><button className="primary-button" disabled={busy}>{busy&&<LoaderCircle size={14} className="spin"/>}{editing?'Save changes':'Save expense'}</button></div></form></div>}
  {toast&&<div className="toast" role="status"><span><Check size={13}/></span>{toast}</div>}
 </div>;
}
function ExpenseRow({ item, currency, onEdit, onDelete }) {
 const [menu,setMenu]=useState(false), Icon=categoryIcons[item.category]||Ellipsis;
 const date=new Date(item.date).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
 return <article className="expense-row"><span className={`row-category-icon ${categoryColors[item.category]}`}><Icon size={16}/></span><button className="expense-main" onClick={onEdit}><b>{item.title}</b><small>{item.note||item.category}</small></button><span className="expense-date">{date}</span><span className="expense-category">{item.category}</span><span className="payment-method"><CreditCard size={13}/>{item.paymentMethod||'Other'}</span><strong className="expense-amount">{money(item.amount,currency)}</strong><div className="row-actions"><button className="icon-button" onClick={()=>setMenu(!menu)} aria-label="Expense actions"><MoreHorizontal size={17}/></button>{menu&&<><button className="menu-dismiss" onClick={()=>setMenu(false)} aria-label="Close menu"/><div className="row-menu"><button onClick={()=>{setMenu(false);onEdit()}}>Edit expense</button><button className="danger-menu" onClick={()=>{setMenu(false);onDelete()}}><Trash2 size={13}/> Delete expense</button></div></>}</div></article>;
}



