/* --------------------------------------------
   GAS CHARLY - MARCK BUSINESS
   Archivo principal de lógica del sistema
   Guarda y carga datos en localStorage
-------------------------------------------- */

// Inicialización de datos
const storage = {
  clientes: JSON.parse(localStorage.getItem('clientes')) || [],
  productos: JSON.parse(localStorage.getItem('productos')) || [],
  ventas: JSON.parse(localStorage.getItem('ventas')) || [],
  creditos: JSON.parse(localStorage.getItem('creditos')) || [],
  tambos: JSON.parse(localStorage.getItem('tambos')) || []
};

// Función para guardar todo en localStorage
function guardarDatos() {
  localStorage.setItem('clientes', JSON.stringify(storage.clientes));
  localStorage.setItem('productos', JSON.stringify(storage.productos));
  localStorage.setItem('ventas', JSON.stringify(storage.ventas));
  localStorage.setItem('creditos', JSON.stringify(storage.creditos));
  localStorage.setItem('tambos', JSON.stringify(storage.tambos));
}

// ------------------- CLIENTES -------------------
function agregarCliente(nombre, telefono, direccion) {
  const cliente = { id: Date.now(), nombre, telefono, direccion };
  storage.clientes.push(cliente);
  guardarDatos();
  alert(`Cliente ${nombre} agregado.`);
}

function listarClientes() {
  return storage.clientes;
}

// ------------------- PRODUCTOS -------------------
function agregarProducto(nombre, precio, stock) {
  const producto = { id: Date.now(), nombre, precio, stock };
  storage.productos.push(producto);
  guardarDatos();
  alert(`Producto ${nombre} agregado.`);
}

function listarProductos() {
  return storage.productos;
}

// ------------------- VENTAS -------------------
function registrarVenta(cliente, producto, cantidad) {
  const prod = storage.productos.find(p => p.nombre === producto);
  if(!prod) return alert('Producto no encontrado');
  if(prod.stock < cantidad) return alert('Stock insuficiente');
  
  const total = prod.precio * cantidad;
  const venta = { id: Date.now(), cliente, producto, cantidad, total, fecha: new Date().toLocaleString() };
  storage.ventas.push(venta);
  prod.stock -= cantidad;
  guardarDatos();
  alert(`Venta registrada: ${producto} x${cantidad} -> Q${total.toFixed(2)}`);
}

// ------------------- CRÉDITOS -------------------
function registrarCredito(cliente, producto, cantidad) {
  const prod = storage.productos.find(p => p.nombre === producto);
  if(!prod) return alert('Producto no encontrado');
  
  const total = prod.precio * cantidad;
  const credito = { id: Date.now(), cliente, producto, cantidad, total, fecha: new Date().toLocaleString(), estado:'Pendiente' };
  storage.creditos.push(credito);
  guardarDatos();
  alert(`Crédito registrado: ${producto} x${cantidad} -> Q${total.toFixed(2)}`);
}

function pagarCredito(id) {
  const credito = storage.creditos.find(c => c.id === id);
  if(!credito) return alert('Crédito no encontrado');
  credito.estado = 'Pagado';
  guardarDatos();
  alert(`Crédito de ${credito.cliente} pagado.`);
}

// ------------------- TAMBORES PRESTADOS -------------------
function prestarTambo(cliente, cantidad) {
  const tambo = { id: Date.now(), cliente, cantidad, fecha: new Date().toLocaleString(), estado:'Prestado' };
  storage.tambos.push(tambo);
  guardarDatos();
  alert(`${cantidad} tambo(s) prestado(s) a ${cliente}`);
}

function devolverTambo(id) {
  const tambo = storage.tambos.find(t => t.id === id);
  if(!tambo) return alert('Registro no encontrado');
  tambo.estado = 'Devuelto';
  guardarDatos();
  alert(`Tambo(s) devuelto(s) de ${tambo.cliente}`);
}

// ------------------- UTILIDADES -------------------
function mostrarVentas() {
  console.table(storage.ventas);
}

function mostrarCreditos() {
  console.table(storage.creditos);
}

function mostrarTambos() {
  console.table(storage.tambos);
}

function mostrarClientes() {
  console.table(storage.clientes);
}

function mostrarProductos() {
  console.table(storage.productos);
}

// ------------------- EJEMPLO DE USO -------------------
// Puedes descomentar para probar
/*
agregarCliente("Juan Perez","12345678","Zona 1");
agregarProducto("Gas 25lb",120,50);
registrarVenta("Juan Perez","Gas 25lb",2);
registrarCredito("Juan Perez","Gas 25lb",1);
prestarTambo("Juan Perez",2);
mostrarVentas();
mostrarCreditos();
mostrarTambos();
mostrarClientes();
mostrarProductos();
*/
