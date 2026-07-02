import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  CheckCircle, LogOut,
  DollarSign, AlertCircle, Calendar, ShieldCheck, Database, FileSpreadsheet
} from 'lucide-react';
import { api } from './services/api.js';

interface Order {
  number: string;
  customer: string;
  part: string;
  reference: string;
  supplier: string;
  price: number;
  created_at: string;
  time: string;
  has_proof: boolean;
  payment_method?: string;
  requires_proof?: boolean;
}

interface ApprovedOrder {
  number: string;
  customer: string;
  part: string;
  price: number;
  time: string;
}

const formatKwanza = (value: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(value);

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('rp_admin_token'));
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard data states
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [approvedOrders, setApprovedOrders] = useState<ApprovedOrder[]>([]);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'info' });

  // Upload inventory states
  const [supplierId, setSupplierId] = useState('1');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadOrders();
      const interval = setInterval(loadOrders, 15000); // refresh every 15s
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setPendingOrders(res.data.pending || []);
      setApprovedOrders(res.data.approved || []);
    } catch (err) {
      console.error("Error loading dashboard orders", err);
      showToast("Failed to load order data.", "error");
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.post('/admin/login', { password });
      if (res.data.token) {
        localStorage.setItem('rp_admin_token', res.data.token);
        setToken(res.data.token);
        showToast("Logged in successfully!", "success");
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Incorrect password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rp_admin_token');
    setToken(null);
    setPassword('');
  };

  const handleApprove = async (number: string) => {
    showToast("Issuing official invoice...", "info");
    try {
      await api.post(`/admin/orders/${number}/approve`);
      showToast(`Order #${number} approved successfully!`, "success");
      loadOrders();
    } catch (err) {
      showToast("Failed to approve the order.", "error");
    }
  };

  const handleReject = async (number: string) => {
    if (!window.confirm(`Are you sure you want to reject order #${number}?`)) return;
    try {
      await api.post(`/admin/orders/${number}/reject`);
      showToast(`Order #${number} rejected. Customer notified.`, "success");
      loadOrders();
    } catch (err) {
      showToast("Failed to reject the order.", "error");
    }
  };

  // Excel/CSV file parsing and upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Parse rows to JSON
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        // Map fields to API expectations (reference, name, price, quantity).
        // Portuguese header aliases are kept — supplier spreadsheets use them.
        const items = rawRows.map(row => {
          const sku = row.reference || row.Reference || row.referencia || row.Referencia || row.SKU || row.CodArtigo || row.codigo || row['Código'];
          const description = row.name || row.Name || row.nome || row.Nome || row.Descricao || row['Descrição'] || row.artigo || row.Artigo;
          const price = parseFloat(row.price || row.Price || row.preco || row.Preco || row['Preço'] || row.PVP || row.PVP1 || '0');
          const qty = parseInt(row.quantity || row.Quantity || row.quantidade || row.Quantidade || row.stock || row.Stock || row.StkActual || '0', 10);

          return {
            reference: String(sku || '').trim(),
            name: String(description || '').trim(),
            price: isNaN(price) ? 0 : price,
            quantity: isNaN(qty) ? 0 : qty
          };
        }).filter(a => a.reference && a.name);

        if (items.length === 0) {
          showToast("No valid items found in the sheet. Check the column headers.", "error");
          setUploadLoading(false);
          return;
        }

        // Upload to backend
        const res = await api.post('/admin/inventory/upload', {
          supplierId: parseInt(supplierId, 10),
          items
        });

        showToast(
          `Sync OK! Inserted: ${res.data.inserted}, Updated: ${res.data.updated}, Deactivated: ${res.data.deactivated}`,
          "success"
        );
      } catch (err: any) {
        showToast("Failed to process the stock file.", "error");
      } finally {
        setUploadLoading(false);
        // Clear input value so same file can be uploaded again
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Stats calculators
  const totalBilledToday = approvedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  // Authentication interface
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-sky-50 text-sky-600 rounded-xl mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Rede Peças</h1>
            <p className="text-sm text-slate-500 mt-1">Order Administration Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Access Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the administrator password"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
            >
              Log In to Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard interface
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header bar */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-sky-400" />
          <h1 className="text-lg font-bold tracking-tight">Rede Peças — Order Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString('en-GB')}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* Toast Notification banner */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border text-sm font-semibold text-white flex items-center gap-3 transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
          toast.type === 'error' ? 'bg-red-600 border-red-500' :
          'bg-slate-800 border-slate-700'
        }`}>
          <span>{toast.msg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Side: Stats and excel Uploader */}
        <div className="lg:col-span-1 space-y-8">

          {/* Stats Box */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Metrics</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Pending Orders</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{pendingOrders.length}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Approved Today</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{approvedOrders.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Daily Revenue</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    {formatKwanza(totalBilledToday)}
                  </p>
                </div>
                <div className="p-3 bg-sky-50 text-sky-600 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Excel Import Box */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Upload Inventory</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Select Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="1">Auto Peças Luanda</option>
                  <option value="2">Moto Parts Angola</option>
                  <option value="3">Import Car Parts</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50/50 transition-all text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  id="excelFileInput"
                  className="hidden"
                  disabled={uploadLoading}
                />
                <label htmlFor="excelFileInput" className="cursor-pointer block">
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet className={`h-10 w-10 text-slate-400 mb-3 ${uploadLoading ? 'animate-bounce text-sky-500' : ''}`} />
                    <p className="text-sm font-bold text-slate-700">
                      {uploadLoading ? 'Processing file...' : 'Import CSV or Excel'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Upload a file with SKU, Item, Stock and Price columns</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Orders tables lists */}
        <div className="lg:col-span-2 space-y-8">

          {/* Pending Orders List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/5 border-b border-slate-200/80">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">⏳ Orders Pending Approval</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No orders pending approval. ✅
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.number} className="p-6 hover:bg-slate-50/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-sm font-bold text-slate-800 mr-2">{order.number}</span>
                        <span className="text-xs font-semibold text-slate-500">at {order.time}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-bold ${
                        order.has_proof ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.has_proof ? 'Proof Received' : 'Awaiting Payment'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                      <div>
                        <p className="text-slate-400 font-medium">Part</p>
                        <p className="font-bold text-slate-800 mt-0.5">{order.part}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">SKU Reference</p>
                        <p className="font-bold text-slate-800 mt-0.5">{order.reference}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Supplier</p>
                        <p className="font-bold text-slate-800 mt-0.5">{order.supplier}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Price</p>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          {formatKwanza(order.price)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 font-medium">Customer (WhatsApp)</p>
                        <p className="font-bold text-slate-800 mt-0.5">{order.customer}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleReject(order.number)}
                        className="flex-1 py-2 px-4 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-all"
                      >
                        ❌ Reject Order
                      </button>
                      <button
                        onClick={() => handleApprove(order.number)}
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                      >
                        ✅ Confirm Payment & Invoice
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approved Orders List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900/5 border-b border-slate-200/80">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">✅ Approved Today</h2>
            </div>

            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {approvedOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No orders approved yet today.
                </div>
              ) : (
                approvedOrders.map((order) => (
                  <div key={order.number} className="p-4 flex items-center justify-between hover:bg-slate-50/20">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{order.number}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{order.part} · {order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {formatKwanza(order.price)}
                      </p>
                      <p className="text-2xs font-semibold text-slate-400 mt-0.5">Approved at {order.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
