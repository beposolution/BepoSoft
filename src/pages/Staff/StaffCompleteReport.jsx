import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import { FiArrowLeft, FiRefreshCw, FiDownload, FiSearch, FiTrendingUp, FiShoppingCart, FiPackage, FiRotateCcw, FiMapPin, FiUser, FiBarChart2 } from 'react-icons/fi';

const API_BASE = (import.meta.env.VITE_APP_KEY || '').replace(/\/+$/, '');
// VITE_APP_KEY normally ends with /api in this project.
const API_URL = `${API_BASE}/staff/complete/report/`;
const money = v => `₹${Number(v || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
const number = v => Number(v || 0).toLocaleString('en-IN');
const label = v => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, x => x.toUpperCase());
const show = v => v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);
const dateString = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const initialDates = () => { const d = new Date(); return {start_date:dateString(new Date(d.getFullYear(),d.getMonth(),1)), end_date:dateString(d)}; };
const TAB_NAMES = ['Overview','Orders','Order Items','GRV / Returns','States','Customers','Products','Staff Details'];
const ORDER_COLUMNS = ['invoice','order_date','status','payment_status','payment_method','total_amount','customer_name','state_name','managed_by_name'];
const ITEM_COLUMNS = ['invoice','product_name','quantity','rate','discount','tax_percent','estimated_line_total','description','size_id','variant_id'];
const GRV_COLUMNS = ['invoice','product','quantity','price','gross_grv_value','status','return_reason','remark','date','note'];
const STATE_COLUMNS = ['state_name','total_bills','gross_order_amount','sales_order_amount','excluded_status_amount','unique_customers','average_bill_amount','previous_sales_amount','sales_difference','sales_change_percent'];
const CUSTOMER_COLUMNS = ['name','bills','amount'];
const PRODUCT_COLUMNS = ['product_name','quantity','bill_count','estimated_line_total'];

function flattenOrders(orders=[]) {
  return orders.map(o => ({...o, customer_name:o.customer?.name, state_name:o.state?.name, managed_by_name:o.managed_by?.name}));
}
function flattenItems(orders=[]) {
  return orders.flatMap(o => (o.order_items || []).map(i => ({...i, invoice:o.invoice, order_id:o.id})));
}
function flattenGRVs(orders=[]) {
  return orders.flatMap(o => (o.grv_details || []).map(g => ({...g, invoice:o.invoice})));
}
function percent(v) { return v == null ? 'N/A' : `${Number(v).toFixed(2)}%`; }
function Metric({title,value,sub,icon:Icon,color='blue'}) {
  return <div className={`sr-metric sr-${color}`}><div className="sr-metric-top"><span>{title}</span>{Icon && <Icon size={19}/>}</div><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}
function TablePanel({title,rows=[],columns=[],filename}) {
  const [query,setQuery]=useState('');
  const [page,setPage]=useState(1);
  const [limit,setLimit]=useState(10);
  useEffect(()=>{setPage(1);setQuery('');},[title]);
  const filtered=useMemo(()=>rows.filter(r=>columns.some(c=>show(r[c]).toLowerCase().includes(query.toLowerCase()))),[rows,columns,query]);
  const pages=Math.max(1,Math.ceil(filtered.length/limit));
  const safePage=Math.min(page,pages);
  const visible=filtered.slice((safePage-1)*limit,safePage*limit);
  const exportRows=()=>downloadExcel([{name:title,rows:filtered,columns}],filename || 'staff_report.xlsx');
  return <div className="sr-panel"><div className="sr-panel-head"><div><h3>{title}</h3><p>{number(rows.length)} records</p></div><button className="sr-btn sr-outline" disabled={!filtered.length} onClick={exportRows}><FiDownload/> Export Excel</button></div>
    <div className="sr-table-controls"><label className="sr-search"><FiSearch/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder={`Search ${title.toLowerCase()}...`}/></label><select value={limit} onChange={e=>{setLimit(+e.target.value);setPage(1);}}>{[10,25,50,100].map(n=><option key={n} value={n}>{n} rows</option>)}</select></div>
    <div className="sr-scroll"><table><thead><tr><th>#</th>{columns.map(c=><th key={c}>{label(c)}</th>)}</tr></thead><tbody>{visible.map((r,i)=><tr key={`${safePage}-${i}`}><td>{(safePage-1)*limit+i+1}</td>{columns.map(c=><td key={c}>{['total_amount','amount','rate','discount','estimated_line_total','gross_grv_value','gross_order_amount','sales_order_amount','excluded_status_amount','average_bill_amount','previous_sales_amount','sales_difference','price'].includes(c)?money(r[c]):c.endsWith('_percent')?percent(r[c]):show(r[c])}</td>)}</tr>)}{!visible.length&&<tr><td colSpan={columns.length+1} className="sr-empty">No matching records found</td></tr>}</tbody></table></div>
    <div className="sr-pagination"><span>Showing {filtered.length?(safePage-1)*limit+1:0}–{Math.min(safePage*limit,filtered.length)} of {filtered.length}</span><div><button disabled={safePage===1} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {safePage} of {pages}</span><button disabled={safePage===pages} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
  </div>;
}
function downloadExcel(sheets,filename) {
  const wb=XLSX.utils.book_new();
  sheets.forEach(({name,rows=[],columns})=>{
    const cols=columns?.length?columns:[...new Set(rows.flatMap(r=>Object.keys(r)))];
    const aoa=[cols.map(label),...rows.map(r=>cols.map(c=>{const v=r[c];return v == null?'':typeof v==='object'?JSON.stringify(v):v;}))];
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols']=cols.map(c=>({wch:Math.min(42,Math.max(17,c.length+8))}));
    ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:Math.max(0,rows.length),c:Math.max(0,cols.length-1)}})};
    cols.forEach((_,i)=>{const cell=ws[XLSX.utils.encode_cell({r:0,c:i})];if(cell)cell.s={fill:{patternType:'solid',fgColor:{rgb:'2858DF'}},font:{bold:true,color:{rgb:'FFFFFF'}},alignment:{wrapText:true}};});
    // Prevent spreadsheet formula injection for user-controlled strings.
    Object.keys(ws).filter(k=>!k.startsWith('!')).forEach(k=>{const cell=ws[k];if(cell.t==='s'&&/^[=+\-@\t\r]/.test(cell.v))cell.v="'"+cell.v;});
    XLSX.utils.book_append_sheet(wb,ws,name.replace(/[\\/?*\[\]:]/g,'').slice(0,31)||'Sheet');
  });
  XLSX.writeFile(wb,filename);
}
function Bars({title,data=[],nameKey,valueKey,currency=false}) {
  const top=data.slice(0,10),max=Math.max(1,...top.map(x=>Number(x[valueKey]||0)));
  return <div className="sr-panel"><div className="sr-panel-head"><h3>{title}</h3></div>{top.length?top.map((r,i)=><div className="sr-bar-row" key={i}><div className="sr-bar-label"><span>{show(r[nameKey])}</span><strong>{currency?money(r[valueKey]):number(r[valueKey])}</strong></div><div className="sr-track"><div style={{width:`${Math.max(0,Number(r[valueKey]||0)/max*100)}%`}}/></div></div>):<p className="sr-empty">No chart data available</p>}</div>;
}
function Trend({title,data=[],valueKey='sales_amount'}) {
  const pts=data.map(d=>Number(d[valueKey]||0)),max=Math.max(1,...pts);
  const W=800,H=240,L=75,R=20,T=20,B=40;
  const xy=(v,i)=>[L+(pts.length<2?(W-L-R)/2:i*(W-L-R)/(pts.length-1)),H-B-v/max*(H-T-B)];
  const path=pts.map((v,i)=>`${i?'L':'M'} ${xy(v,i).join(' ')}`).join(' ');
  return <div className="sr-panel"><div className="sr-panel-head"><h3>{title}</h3></div>{pts.length?<div className="sr-chart"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>{[0,.25,.5,.75,1].map(f=><g key={f}><line x1={L} x2={W-R} y1={xy(max*f,0)[1]} y2={xy(max*f,0)[1]} stroke="#e6eaf2"/><text x={L-10} y={xy(max*f,0)[1]+4} textAnchor="end" fill="#64748b" fontSize="12">{money(max*f)}</text></g>)}<path d={path} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>{pts.map((v,i)=><circle key={i} cx={xy(v,i)[0]} cy={xy(v,i)[1]} r="4" fill="#2563eb"><title>{`${data[i].date || data[i].month}: ${money(v)}`}</title></circle>)}<text x={L} y={H-9} fontSize="12" fill="#64748b">{data[0]?.date||data[0]?.month}</text><text x={W-R} y={H-9} fontSize="12" fill="#64748b" textAnchor="end">{data[data.length-1]?.date||data[data.length-1]?.month}</text></svg></div>:<p className="sr-empty">No chart data available</p>}</div>;
}
function Comparison({data={}}) {return <div className="sr-panel"><div className="sr-panel-head"><h3>Previous Period Comparison</h3></div><div className="sr-scroll"><table><thead><tr><th>Metric</th><th>Current</th><th>Previous</th><th>Difference</th><th>Change</th></tr></thead><tbody>{Object.entries(data).map(([key,v])=><tr key={key}><td>{label(key)}</td><td>{key==='bills'?number(v.current):money(v.current)}</td><td>{key==='bills'?number(v.previous):money(v.previous)}</td><td>{key==='bills'?number(v.difference):money(v.difference)}</td><td>{percent(v.change_percent)}</td></tr>)}</tbody></table></div></div>}
function Details({staff={}}) {return <div className="sr-panel"><div className="sr-panel-head"><h3>Staff Personal Details</h3></div><div className="sr-details">{Object.entries(staff).map(([key,value])=><div key={key}><span>{label(key)}</span><strong>{show(value)}</strong></div>)}</div></div>}

export default function StaffCompleteReport(){
  const {staffId,userId,id}=useParams();
  const selectedId=staffId||userId||id;
  const navigate=useNavigate();
  const [draft,setDraft]=useState(initialDates);
  const [filters,setFilters]=useState(initialDates);
  const [refresh,setRefresh]=useState(0);
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [tab,setTab]=useState('Overview');
  useEffect(()=>{
    const controller=new AbortController();
    if(!selectedId){setError('No staff found');setLoading(false);return ()=>controller.abort();}
    const token=localStorage.getItem('token');
    setLoading(true);setError('');
    axios.get(API_URL,{headers:{Authorization:`Bearer ${token}`},params:{user_id:selectedId,...filters},signal:controller.signal})
      .then(res=>{if(!controller.signal.aborted)setReport(res.data);})
      .catch(err=>{if(controller.signal.aborted||axios.isCancel(err))return;setError(err.response?.data?.message||err.message||'Unable to load staff report');setReport(null);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[selectedId,filters,refresh]);
  const orders=useMemo(()=>flattenOrders(report?.orders||[]),[report]);
  const items=useMemo(()=>flattenItems(report?.orders||[]),[report]);
  const grvs=useMemo(()=>flattenGRVs(report?.orders||[]),[report]);
  const states=useMemo(()=>(report?.state_wise_report||[]).map(s=>({...s,...(s.comparison||{})})),[report]);
  const customers=report?.customers||[];
  const products=report?.order_items_summary?.products||[];
  const graphs=report?.graphs||{};
  const summary=report?.summary||{};
  const staff=report?.staff||{};
  const onApply=e=>{e.preventDefault();if(draft.start_date>draft.end_date){setError('Start date cannot be after end date');return;}setError('');setFilters({...draft});};
  const onClear=()=>{const d=initialDates();setDraft(d);setFilters(d);setError('');};
  const exportAll=()=>downloadExcel([
    {name:'Staff Details',rows:Object.entries(staff).map(([field,value])=>({field,value:show(value)}))},
    {name:'Summary',rows:Object.entries(summary).map(([metric,value])=>({metric,value:show(value)}))},
    {name:'Comparison',rows:Object.entries(report?.comparison||{}).map(([metric,value])=>({metric,...value}))},
    {name:'Orders',rows:orders,columns:ORDER_COLUMNS},
    {name:'Order Items',rows:items,columns:ITEM_COLUMNS},
    {name:'GRV',rows:grvs,columns:GRV_COLUMNS},
    {name:'States',rows:states,columns:STATE_COLUMNS},
    {name:'Customers',rows:customers,columns:CUSTOMER_COLUMNS},
    {name:'Products',rows:products,columns:PRODUCT_COLUMNS},
  ],`Staff_Complete_Report_${selectedId}.xlsx`);
  useEffect(()=>{document.title='Staff Complete Report | BEPOSOFT';},[]);
  return <div className="sr-page"><style>{`
    .sr-page{background:#f4f7fc;min-height:100vh;padding:24px;font-family:Inter,Poppins,Arial,sans-serif;color:#17233b}.sr-container{max-width:1600px;margin:auto}.sr-header,.sr-actions,.sr-filters,.sr-tabs,.sr-panel-head,.sr-metric-top,.sr-bar-label,.sr-table-controls,.sr-pagination,.sr-pagination>div{display:flex;align-items:center;justify-content:space-between;gap:12px}.sr-header{margin-bottom:20px;flex-wrap:wrap}.sr-header h1{font-size:25px;margin:0 0 5px}.sr-header p,.sr-panel-head p{color:#718096;margin:0;font-size:13px}.sr-actions{flex-wrap:wrap}.sr-btn{border:0;background:#2858df;color:white;border-radius:9px;padding:10px 15px;display:inline-flex;align-items:center;gap:8px;font-weight:600;cursor:pointer}.sr-btn:disabled{opacity:.5;cursor:not-allowed}.sr-outline{background:white;border:1px solid #dce4f1;color:#2a3a55}.sr-panel{background:white;border:1px solid #e5eaf3;border-radius:14px;padding:21px;margin-bottom:18px;box-shadow:0 2px 12px #15274708}.sr-panel-head{margin-bottom:18px;flex-wrap:wrap}.sr-panel-head h3{font-size:17px;margin:0}.sr-filters{justify-content:flex-start;flex-wrap:wrap}.sr-filters label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600}.sr-filters input,.sr-table-controls input,.sr-table-controls select{border:1px solid #dce4f1;border-radius:8px;padding:10px;background:white;color:#17233b}.sr-filters button{align-self:end}.sr-profile{display:flex;align-items:center;gap:15px}.sr-avatar{height:54px;width:54px;display:grid;place-items:center;background:#eaf1ff;border-radius:13px;color:#2858df}.sr-profile h2{margin:0;font-size:20px}.sr-profile p{margin:5px 0 0;color:#64748b}.sr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:20px}.sr-metric{border-radius:13px;padding:19px;background:white;border:1px solid #e5eaf3;border-top:4px solid #2858df}.sr-metric.sr-green{border-top-color:#10a977}.sr-metric.sr-orange{border-top-color:#f3a03c}.sr-metric.sr-red{border-top-color:#ed6179}.sr-metric.sr-purple{border-top-color:#8b5cf6}.sr-metric-top{font-size:13px;color:#64748b}.sr-metric strong{display:block;font-size:23px;margin:13px 0 4px}.sr-metric small{color:#94a3b8}.sr-tabs{justify-content:flex-start;overflow:auto;gap:5px;margin:18px 0;padding-bottom:5px}.sr-tabs button{white-space:nowrap;background:white;border:1px solid #e5eaf3;padding:12px 16px;border-radius:9px;color:#53637d;cursor:pointer;font-weight:600}.sr-tabs button.active{background:#2858df;color:white;border-color:#2858df}.sr-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.sr-scroll{overflow:auto}.sr-scroll table{border-collapse:collapse;width:100%;font-size:13px;white-space:nowrap}.sr-scroll th{text-align:left;background:#f0f4fb;color:#42526b;padding:13px;border-bottom:1px solid #e3e9f3}.sr-scroll td{padding:12px 13px;border-bottom:1px solid #edf0f5}.sr-scroll tbody tr:hover{background:#f8faff}.sr-table-controls{margin-bottom:15px;justify-content:space-between}.sr-search{display:flex;align-items:center;gap:8px;border:1px solid #dce4f1;border-radius:9px;padding-left:10px}.sr-search input{border:0;outline:none;min-width:240px}.sr-pagination{padding-top:16px;color:#64748b;font-size:13px;flex-wrap:wrap}.sr-pagination button{background:white;border:1px solid #dce4f1;padding:7px 12px;border-radius:7px;cursor:pointer}.sr-pagination button:disabled{opacity:.4}.sr-empty{text-align:center;color:#94a3b8;padding:32px}.sr-bar-row{margin:17px 0}.sr-bar-label{font-size:13px;margin-bottom:7px}.sr-track{height:10px;background:#edf2fa;border-radius:9px;overflow:hidden}.sr-track>div{height:100%;background:#2858df;border-radius:9px}.sr-chart svg{width:100%;height:auto}.sr-details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.sr-details>div{border:1px solid #edf0f5;padding:13px;border-radius:8px;min-width:0;overflow-wrap:anywhere}.sr-details span{display:block;color:#64748b;font-size:12px;margin-bottom:8px}.sr-details strong{font-size:14px}.sr-error{padding:16px;background:#fff0f2;border:1px solid #ffd4db;color:#aa2743;border-radius:10px;margin-bottom:15px}.sr-loading{padding:60px;text-align:center;color:#64748b}@media(max-width:1100px){.sr-grid{grid-template-columns:repeat(2,1fr)}.sr-charts{grid-template-columns:1fr}.sr-details{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.sr-page{padding:12px}.sr-grid,.sr-details{grid-template-columns:1fr}.sr-header{align-items:flex-start}.sr-filters label{width:100%}.sr-search input{min-width:0;width:100%}.sr-table-controls{flex-wrap:wrap}}
  `}</style><div className="sr-container">
    <div className="sr-header"><div><h1>Staff Complete Report</h1><p>Staff sales, orders, returns, state-wise performance and comparisons</p></div><div className="sr-actions"><button className="sr-btn sr-outline" onClick={()=>navigate(-1)}><FiArrowLeft/> Back</button><button className="sr-btn sr-outline" onClick={()=>setRefresh(v=>v+1)}><FiRefreshCw/> Refresh</button><button className="sr-btn" disabled={!report||loading} onClick={exportAll}><FiDownload/> Export Excel</button></div></div>
    <form className="sr-panel sr-filters" onSubmit={onApply}><label>Start Date<input type="date" value={draft.start_date} onChange={e=>setDraft(d=>({...d,start_date:e.target.value}))} required/></label><label>End Date<input type="date" value={draft.end_date} onChange={e=>setDraft(d=>({...d,end_date:e.target.value}))} required/></label><button type="submit" className="sr-btn">Apply Filters</button><button type="button" className="sr-btn sr-outline" onClick={onClear}>Clear Filters</button></form>
    {error&&<div className="sr-error">{error}</div>}
    {loading?<div className="sr-panel sr-loading">Loading staff complete report...</div>:report&&<>
      <div className="sr-panel sr-profile"><div className="sr-avatar"><FiUser size={28}/></div><div><h2>{staff.name||'Staff'} <span style={{fontSize:13,color:'#2858df'}}>({staff.department||'—'})</span></h2><p>{staff.designation||'—'} · Staff ID: {staff.staff_id||staff.id} · {staff.email||'No email'}</p></div></div>
      <div className="sr-grid"><Metric title="Total Sales" value={money(summary.sales_order_amount)} icon={FiTrendingUp}/><Metric title="Total Bills" value={number(summary.total_bills)} icon={FiShoppingCart} color="purple"/><Metric title="Gross Order Amount" value={money(summary.gross_order_amount)} icon={FiBarChart2} color="green"/><Metric title="Average Bill Amount" value={money(summary.average_bill_amount)} color="orange"/><Metric title="Unique Customers" value={number(summary.unique_customers)} icon={FiUser}/><Metric title="Product Quantity" value={number(report.order_items_summary?.total_quantity)} icon={FiPackage} color="purple"/><Metric title="GRV Value" value={money(report.grv_summary?.gross_grv_value)} icon={FiRotateCcw} color="red"/><Metric title="States Served" value={number(states.length||report.states?.length)} icon={FiMapPin} color="green"/></div>
      <nav className="sr-tabs">{TAB_NAMES.map(t=><button key={t} type="button" className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</nav>
      {tab==='Overview'&&<><Comparison data={report.comparison}/><div className="sr-charts"><Trend title="Daily Sales Trend" data={graphs.daily_orders||[]}/><Trend title="Monthly Sales Trend" data={(graphs.monthly_orders||[]).map(x=>({...x,sales_amount:x.amount}))}/><Bars title="Sales by State" data={graphs.state_wise_sales||report.states||[]} nameKey={graphs.state_wise_sales?'state_name':'name'} valueKey={graphs.state_wise_sales?'sales_amount':'amount'} currency/><Bars title="Top Selling Products" data={graphs.top_products||[]} nameKey="product_name" valueKey="quantity"/><Bars title="Order Status Distribution" data={graphs.order_status||[]} nameKey="status" valueKey="count"/><Bars title="Payment Status Distribution" data={graphs.payment_status||[]} nameKey="status" valueKey="count"/><Bars title="GRV Status" data={graphs.grv_status||[]} nameKey="status" valueKey="count"/></div></>}
      {tab==='Orders'&&<><div className="sr-panel"><div className="sr-panel-head"><h3>Order Status Summary</h3></div><div className="sr-details">{Object.entries(summary.order_status_counts||{}).map(([k,v])=><div key={k}><span>{k}</span><strong>{number(v)} bills</strong></div>)}</div></div><TablePanel title="Orders" rows={orders} columns={ORDER_COLUMNS} filename={`staff_${selectedId}_orders.xlsx`}/></>}
      {tab==='Order Items'&&<TablePanel title="Order Items" rows={items} columns={ITEM_COLUMNS} filename={`staff_${selectedId}_items.xlsx`}/>}
      {tab==='GRV / Returns'&&<><div className="sr-grid"><Metric title="GRV Records" value={number(report.grv_summary?.total_grv_records)} color="red"/><Metric title="Gross GRV Value" value={money(report.grv_summary?.gross_grv_value)} color="red"/></div><TablePanel title="GRV / Returns" rows={grvs} columns={GRV_COLUMNS} filename={`staff_${selectedId}_grv.xlsx`}/></>}
      {tab==='States'&&<><Bars title="State-wise Sales" data={states.length?states:(report.states||[])} nameKey={states.length?'state_name':'name'} valueKey={states.length?'sales_order_amount':'amount'} currency/><TablePanel title="State-wise Report" rows={states.length?states:(report.states||[])} columns={states.length?STATE_COLUMNS:['name','bills','amount']} filename={`staff_${selectedId}_states.xlsx`}/></>}
      {tab==='Customers'&&<TablePanel title="Customer-wise Sales" rows={customers} columns={CUSTOMER_COLUMNS} filename={`staff_${selectedId}_customers.xlsx`}/>}
      {tab==='Products'&&<TablePanel title="Product Performance" rows={products} columns={PRODUCT_COLUMNS} filename={`staff_${selectedId}_products.xlsx`}/>}
      {tab==='Staff Details'&&<Details staff={staff}/>}
      <p style={{fontSize:12,color:'#64748b',paddingBottom:25}}>Sales amounts exclude the API's excluded order statuses. GRV amounts are reported separately, not deducted from sales. Product line totals are estimates according to the backend calculation.</p>
    </>}
  </div></div>;
}
