// GAS CHARLY - Sistema local usando LocalStorage
// Autor: Generado por ChatGPT (adaptalo si quieres)

// ---------- UTILIDADES ----------
const DB_KEY = 'gascharly_db_v1';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

function loadDB(){
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const initial = { products:[], clients:[], sales:[], loans:[] };
    localStorage.setItem(DB_KEY, JSON.stringify(initial));
    return initial;
  }
  try { return JSON.parse(raw); } catch(e){ 
    console.error('DB corrupta, restaurando...'); 
    const initial = { products:[], clients:[], sales:[], loans:[] }; 
    localStorage.setItem(DB_KEY, JSON.stringify(initial)); 
    return initial; 
  }
}
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

// inicializar DB en memoria
let DB = loadDB();
function refreshDB(){ DB = loadDB(); }

// ---------- VISTAS ----------
document.querySelectorAll('.menu-btn').forEach(b=>{
  b.addEventListener('click', ()=> {
    const view = b.getAttribute('data-view');
    document.querySelectorAll('.view').forEach(v=>v.style.display='none');
    document.getElementById('view-' + view).style.display = '';
    if(view==='productos') renderProducts();
    if(view==='clientes') renderClients();
    if(view==='ventas') renderSaleUI();
    if(view==='creditos') renderCredits();
    if(view==='tambos') renderLoans();
    if(view==='reportes') renderSummary();
  });
});

// ---------- PRODUCTOS ----------
let editingProductId = null;
const prodName = document.getElementById('prod-name');
const prodPrice = document.getElementById('prod-price');
const prodStock = document.getElementById('prod-stock');
const prodTableBody = document.querySelector('#prod-table tbody');
const prodSearch = document.getElementById('prod-search');

document.getElementById('prod-save').addEventListener('click', ()=>{
  const name = prodName.value.trim();
  const price = parseFloat(prodPrice.value || 0);
  const stock = parseInt(prodStock.value || 0, 10);
  if(!name) return alert('Nombre requerido');
  if(editingProductId){
    const p = DB.products.find(x=>x.id===editingProductId);
    if(p){ p.name = name; p.price = price; p.stock = stock; p.updatedAt = new Date().toISOString(); }
    editingProductId = null;
  } else {
    DB.products.push({ id: uid(), name, price, stock, createdAt: new Date().toISOString() });
  }
  saveDB(DB); renderProducts(); clearProdForm();
  populateSaleProductSelects();
});
document.getElementById('prod-clear').addEventListener('click', clearProdForm);
prodSearch.addEventListener('input', renderProducts);

function clearProdForm(){ editingProductId = null; prodName.value=''; prodPrice.value=''; prodStock.value=''; }

function renderProducts(){
  refreshDB();
  const q = prodSearch.value.trim().toLowerCase();
  prodTableBody.innerHTML = '';
  DB.products.filter(p=>p.name.toLowerCase().includes(q)).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>Q${Number(p.price).toFixed(2)}</td><td>${p.stock}</td>
      <td>
        <button onclick="editProduct('${p.id}')">Editar</button>
        <button onclick="deleteProduct('${p.id}')">Eliminar</button>
      </td>`;
    prodTableBody.appendChild(tr);
  });
}
window.editProduct = function(id){
  const p = DB.products.find(x=>x.id===id); if(!p) return alert('No encontrado');
  editingProductId = id; prodName.value = p.name; prodPrice.value = p.price; prodStock.value = p.stock;
}
window.deleteProduct = function(id){
  if(!confirm('Eliminar producto?')) return;
  DB.products = DB.products.filter(x=>x.id!==id); saveDB(DB); renderProducts(); populateSaleProductSelects();
}

// ---------- CLIENTES ----------
let editingClientId = null;
const cliName = document.getElementById('cli-name');
const cliPhone = document.getElementById('cli-phone');
const cliNote = document.getElementById('cli-note');
const cliTableBody = document.querySelector('#cli-table tbody');
const cliSearch = document.getElementById('cli-search');

document.getElementById('cli-save').addEventListener('click', ()=>{
  const name = cliName.value.trim(); const phone = cliPhone.value.trim(); const note = cliNote.value.trim();
  if(!name) return alert('Nombre requerido');
  if(editingClientId){
    const c = DB.clients.find(x=>x.id===editingClientId);
    if(c){ c.name=name; c.phone=phone; c.note=note; c.updatedAt=new Date().toISOString(); }
    editingClientId = null;
  } else {
    DB.clients.push({ id: uid(), name, phone, note, createdAt: new Date().toISOString() });
  }
  saveDB(DB); renderClients(); clearClientForm(); populateSaleClientSelects(); populateLoanClientSelect();
});
document.getElementById('cli-clear').addEventListener('click', clearClientForm);
cliSearch.addEventListener('input', renderClients);

function clearClientForm(){ editingClientId=null; cliName.value=''; cliPhone.value=''; cliNote.value=''; }

function renderClients(){
  refreshDB();
  const q = cliSearch.value.trim().toLowerCase();
  cliTableBody.innerHTML = '';
  DB.clients.filter(c=>c.name.toLowerCase().includes(q)).forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.name}</td><td>${c.phone||''}</td><td>${c.note||''}</td>
      <td><button onclick="editClient('${c.id}')">Editar</button><button onclick="deleteClient('${c.id}')">Eliminar</button></td>`;
    cliTableBody.appendChild(tr);
  });
}
window.editClient = function(id){ const c = DB.clients.find(x=>x.id===id); if(!c) return; editingClientId=id; cliName.value=c.name; cliPhone.value=c.phone; cliNote.value=c.note; }
window.deleteClient = function(id){ if(!confirm('Eliminar cliente?')) return; DB.clients = DB.clients.filter(x=>x.id!==id); saveDB(DB); renderClients(); populateSaleClientSelects(); populateLoanClientSelect(); }

// ---------- VENTAS (Carrito) ----------
let CART = [];
const saleProductSelect = document.getElementById('sale-product');
const saleQty = document.getElementById('sale-qty');
const salePrice = document.getElementById('sale-price');
const cartTableBody = document.querySelector('#cart-table tbody');
const saleClientSelect = document.getElementById('sale-client');
const saleType = document.getElementById('sale-type');

document.getElementById('sale-add').addEventListener('click', async ()=>{
  const pid = saleProductSelect.value; const qty = parseInt(saleQty.value||1,10) || 1;
  if(!pid) return alert('Seleccione producto');
  refreshDB();
  const p = DB.products.find(x=>x.id===pid); const unit = parseFloat(salePrice.value) || (p ? p.price : 0);
  CART.push({ productId: pid, name: (p? p.name : 'Producto'), qty, unitPrice: Number(unit), total: Number((qty*unit).toFixed(2)) });
  renderCart();
});
document.getElementById('sale-clearcart').addEventListener('click', ()=>{ CART=[]; renderCart(); });

function renderSaleUI(){
  refreshDB(); populateSaleProductSelects(); populateSaleClientSelects(); renderCart(); renderSalesTable();
}

function renderCart(){
  cartTableBody.innerHTML = '';
  CART.forEach((it, i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.name}</td><td>${it.qty}</td><td>Q${Number(it.unitPrice).toFixed(2)}</td><td>Q${Number(it.total).toFixed(2)}</td>
      <td><button onclick="removeCart(${i})">X</button></td>`;
    cartTableBody.appendChild(tr);
  });
}
window.removeCart = function(i){ CART.splice(i,1); renderCart(); }

function populateSaleProductSelects(){
  refreshDB();
  saleProductSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
  DB.products.forEach(p=> {
    const opt = document.createElement('option'); opt.value = p.id; opt.textContent = `${p.name} - Q${Number(p.price).toFixed(2)} (stock:${p.stock})`; saleProductSelect.appendChild(opt);
  });
}
function populateSaleClientSelects(){
  refreshDB();
  saleClientSelect.innerHTML = '<option value="">-- Ninguno --</option>';
  DB.clients.forEach(c=>{ const opt=document.createElement('option'); opt.value=c.id; opt.textContent=c.name; saleClientSelect.appendChild(opt); });
}

// finalizar venta
document.getElementById('sale-finish').addEventListener('click', ()=>{
  if(CART.length===0) return alert('Carrito vacío');
  refreshDB();
  const tipo = saleType.value; const clientId = saleClientSelect.value || null;
  const total = CART.reduce((a,c)=>a+c.total,0);
  CART.forEach(it=>{
    const p = DB.products.find(x=>x.id===it.productId);
    if(p){ p.stock = Math.max(0, Number(p.stock) - Number(it.qty)); }
  });
  const sale = { id: uid(), items: CART.map(it=>({...it})), total: Number(total.toFixed(2)), type: tipo, clientId, paid: tipo==='cash', createdAt: new Date().toISOString(), payments: (tipo==='cash')? [{ id: uid(), amount: Number(total.toFixed(2)), date: new Date().toISOString(), note:'Pago en efectivo' }]:[] };
  DB.sales.push(sale); saveDB(DB);
  alert('Venta registrada: ' + sale.id);
  CART = []; renderCart(); renderProducts(); renderSalesTable(); renderCredits(); populateSaleProductSelects();
});

// ---------- VENTAS LISTADO ----------
const salesTableBody = document.querySelector('#sales-table tbody');
function renderSalesTable(){
  refreshDB();
  salesTableBody.innerHTML = '';
  DB.sales.slice().reverse().forEach(s=>{
    const client = DB.clients.find(c=>c.id===s.clientId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.id}</td><td>${s.type}</td><td>Q${Number(s.total).toFixed(2)}</td><td>${client?client.name:''}</td><td>${s.paid? 'Sí' : 'No'}</td>
      <td>${s.type==='credit' ? `<button onclick="openPay('${s.id}')">Agregar pago</button>` : ''}</td>`;
    salesTableBody.appendChild(tr);
  });
}
document.getElementById('sales-refresh').addEventListener('click', renderSalesTable);

// ---------- CREDITOS ----------
const creditsTableBody = document.querySelector('#credits-table tbody');
function renderCredits(){
  refreshDB();
  creditsTableBody.innerHTML = '';
  DB.sales.filter(s=>s.type==='credit').forEach(s=>{
    const client = DB.clients.find(c=>c.id===s.clientId);
    const paid = (s.payments||[]).reduce((a,p)=>a+Number(p.amount),0);
    const pending = Number((s.total - paid).toFixed(2));
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${s.id}</td><td>${client?client.name:'--'}</td><td>Q${Number(s.total).toFixed(2)}</td><td>Q${paid.toFixed(2)}</td><td>Q${pending.toFixed(2)}</td>
      <td><button onclick="openPay('${s.id}')">Pagar</button></td>`;
    creditsTableBody.appendChild(tr);
  });
}
window.openPay = function(saleId){
  const amount = prompt('Monto a pagar (Q):');
  if(!amount) return;
  const note = prompt('Nota (opcional):','Pago parcial');
  applyPayment(saleId, Number(amount), note);
}
function applyPayment(saleId, amount, note=''){
  refreshDB();
  const s = DB.sales.find(x=>x.id===saleId); if(!s) return alert('Venta no encontrada');
  s.payments = s.payments || [];
  s.payments.push({ id: uid(), amount: Number(amount), date: new Date().toISOString(), note });
  const paidSoFar = s.payments.reduce((a,p)=>a+Number(p.amount),0);
  if(paidSoFar >= s.total) s.paid = true;
  saveDB(DB); renderCredits(); renderSalesTable(); renderSummary();
}

// ---------- TAMBOS / PRÉSTAMOS ----------
const loanItem = document.getElementById('loan-item');
const loanQty = document.getElementById('loan-qty');
const loanClient = document.getElementById('loan-client');
const loanTableBody = document.querySelector('#loan-table tbody');

document.getElementById('loan-save').addEventListener('click', ()=>{
  const item = loanItem.value.trim() || 'Bombona';
  const qty = parseInt(loanQty.value||1,10) || 1;
  const clientId = loanClient.value || null;
  const loan = { id: uid(), item, qty, clientId, givenAt: new Date().toISOString(), returnedAt: null, status: 'lent', note: '' };
  DB.loans.push(loan); saveDB(DB); loanItem.value=''; loanQty.value='1'; renderLoans();
});
document.getElementById('loan-refresh').addEventListener('click', renderLoans);

function populateLoanClientSelect(){
  refreshDB();
  loanClient.innerHTML = '<option value="">-- Ninguno --</option>';
  DB.clients.forEach(c=>{ const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; loanClient.appendChild(opt);});
}

function renderLoans(){
  refreshDB();
  loanTableBody.innerHTML = '';
  DB.loans.slice().reverse().forEach(l=>{
    const client = DB.clients.find(c=>c.id===l.clientId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.item}</td><td>${l.qty}</td><td>${client?client.name:''}</td><td>${l.status}</td>
      <td>${l.status==='lent' ? `<button onclick="returnLoan('${l.id}')">Marcar devuelto</button>` : '—'}</td>`;
    loanTableBody.appendChild(tr);
  });
}
window.returnLoan = function(id){
  if(!confirm('Marcar como devuelto?')) return;
  const l = DB.loans.find(x=>x.id===id); if(!l) return;
  l.status='returned'; l.returnedAt = new Date().toISOString(); saveDB(DB); renderLoans();
}

// ---------- REPORTES / RESUMEN ----------
function renderSummary(){
  refreshDB();
  const totalVentas = DB.sales.reduce((a,s)=>a+Number(s.total),0);
  const totalEfectivo = DB.sales.filter(s=>s.type==='cash').reduce((a,s)=>a+Number(s.total),0);
  const totalCredito = DB.sales.filter(s=>s.type==='credit').reduce((a,s)=>a+Number(s.total),0);
  const pendientes = DB.sales.filter(s=>s.type==='credit' && !s.paid).map(s=>{
    const paid = (s.payments||[]).reduce((a,p)=>a+Number(p.amount),0);
    return { id:s.id, client: (DB.clients.find(c=>c.id===s.clientId)||{}).name || '', total:s.total, paid, pending: Number(s.total - paid) };
  });

  let html = `
    <h3>Resumen de Reportes</h3>
    <ul>
      <li><strong>Productos registrados:</strong> ${DB.products.length}</li>
      <li><strong>Clientes registrados:</strong> ${DB.clients.length}</li>
      <li><strong>Ventas totales:</strong> ${DB.sales.length}</li>
      <li><strong>Total de ventas:</strong> Q${totalVentas.toFixed(2)}</li>
      <li><strong>Efectivo:</strong> Q${totalEfectivo.toFixed(2)}</li>
      <li><strong>Crédito:</strong> Q${totalCredito.toFixed(2)}</li>
      <li><strong>Préstamos:</strong> ${DB.loans.length}</li>
    </ul>
  `;

  if(pendientes.length>0){
    html += `<h4>Créditos pendientes:</h4><ul>`;
    pendientes.forEach(c=>{
      html += `<li>${c.client}: Q${c.pending.toFixed(2)}</li>`;
    });
    html += `</ul>`;
  }

  document.getElementById('summary').innerHTML = html;
}

// ---------- EXPORT / IMPORT / RESET ----------
document.getElementById('export-json').addEventListener('click', ()=>{
  const dataStr = JSON.stringify(DB, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'gascharly_backup_' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'_') + '.json'; a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-json').addEventListener('click', ()=>{
  const f = document.getElementById('import-file').files[0];
  if(!f) return alert('Selecciona un archivo .json');
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      if(!confirm('Importar reemplazará los datos actuales. Estás seguro?')) return;
      localStorage.setItem(DB_KEY, JSON.stringify(obj));
      refreshDB(); renderProducts(); renderClients(); renderSaleUI(); renderCredits(); renderLoans(); renderSummary();
      alert('Importado con éxito');
    } catch(err){ alert('Archivo JSON inválido'); }
  };
  reader.readAsText(f);
});

document.getElementById('reset-all').addEventListener('click', ()=>{
  if(!confirm('RESET TOTAL: eliminará todos los datos. Seguro?')) return;
  localStorage.removeItem(DB_KEY); DB = loadDB(); renderProducts(); renderClients(); renderSaleUI(); renderCredits(); renderLoans(); renderSummary();
});

// ---------- INICIALIZACIÓN ----------
function init(){
  refreshDB();
  if(DB.products.length===0 && DB.clients.length===0 && DB.sales.length===0 && DB.loans.length===0){
    DB.products.push({ id: uid(), name:'Bombona 10 kg', price: 120, stock: 20, createdAt:new Date().toISOString() });
    DB.products.push({ id: uid(), name:'Recarga de gas', price: 85, stock: 100, createdAt:new Date().toISOString() });
    DB.clients.push({ id: uid(), name:'Consumidor final', phone:'', note:'Cliente genérico', createdAt:new Date().toISOString() });
    saveDB(DB);
  }
  renderProducts(); renderClients(); populateSaleProductSelects(); populateSaleClientSelects(); populateLoanClientSelect(); renderSalesTable(); renderCredits(); renderLoans(); renderSummary();
}
init();
