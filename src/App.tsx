import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, FileText, CheckCircle, XCircle, LogOut, 
  DollarSign, AlertCircle, Calendar, ShieldCheck, Database, FileSpreadsheet
} from 'lucide-react';
import { api } from './services/api.js';

interface Pedido {
  numero: string;
  cliente: string;
  peca: string;
  referencia: string;
  fornecedor: string;
  preco: number;
  criado_em: string;
  hora: string;
  tem_comprovativo: boolean;
  metodo_pagamento?: string;
  requer_comprovativo?: boolean;
}

interface PedidoAprovado {
  numero: string;
  cliente: string;
  peca: string;
  preco: number;
  hora: string;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('rp_admin_token'));
  const [senha, setSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  
  // Dashboard data states
  const [pedidosPendentes, setPedidosPendentes] = useState<Pedido[]>([]);
  const [pedidosAprovados, setPedidosAprovados] = useState<PedidoAprovado[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({ show: false, msg: '', type: 'info' });

  // Upload inventory states
  const [fornecedorId, setFornecedorId] = useState('1');
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (token) {
      carregarPedidos();
      const interval = setInterval(carregarPedidos, 15000); // refresh every 15s
      return () => clearInterval(interval);
    }
  }, [token]);

  const carregarPedidos = async () => {
    try {
      const res = await api.get('/admin/pedidos');
      setPedidosPendentes(res.data.pendentes || []);
      setPedidosAprovados(res.data.aprovados || []);
    } catch (err) {
      console.error("Error loading dashboard orders", err);
      showToast("Erro ao carregar dados dos pedidos.", "error");
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    try {
      const res = await api.post('/admin/login', { senha });
      if (res.data.token) {
        localStorage.setItem('rp_admin_token', res.data.token);
        setToken(res.data.token);
        showToast("Login efectuado com sucesso!", "success");
      }
    } catch (err: any) {
      setErroLogin(err.response?.data?.erro || "Palavra-passe incorrecta.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rp_admin_token');
    setToken(null);
    setSenha('');
  };

  const handleAprovar = async (numero: string) => {
    showToast("A emitir factura oficial...", "info");
    try {
      await api.post(`/admin/pedidos/${numero}/aprovar`);
      showToast(`Pedido #${numero} aprovado com sucesso!`, "success");
      carregarPedidos();
    } catch (err) {
      showToast("Erro ao aprovar o pedido.", "error");
    }
  };

  const handleRejeitar = async (numero: string) => {
    if (!window.confirm(`Tem a certeza que deseja rejeitar o pedido #${numero}?`)) return;
    try {
      await api.post(`/admin/pedidos/${numero}/rejeitar`);
      showToast(`Pedido #${numero} rejeitado. Cliente notificado.`, "success");
      carregarPedidos();
    } catch (err) {
      showToast("Erro ao rejeitar o pedido.", "error");
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

        // Map fields to API expectations (referencia, nome, preco, quantidade)
        const artigos = rawRows.map(row => {
          // Normalize spreadsheet column naming headers
          const SKU = row.referencia || row.Referencia || row.SKU || row.CodArtigo || row.codigo || row['Código'];
          const Descricao = row.nome || row.Nome || row.Descricao || row['Descrição'] || row.artigo || row.Artigo;
          const Preco = parseFloat(row.preco || row.Preco || row['Preço'] || row.PVP || row.PVP1 || '0');
          const Qtd = parseInt(row.quantidade || row.Quantidade || row.stock || row.Stock || row.StkActual || '0', 10);

          return {
            referencia: String(SKU || '').trim(),
            nome: String(Descricao || '').trim(),
            preco: isNaN(Preco) ? 0 : Preco,
            quantidade: isNaN(Qtd) ? 0 : Qtd
          };
        }).filter(a => a.referencia && a.nome);

        if (artigos.length === 0) {
          showToast("Nenhum artigo válido encontrado na folha. Verifique os cabeçalhos.", "error");
          setUploadLoading(false);
          return;
        }

        // Upload to backend
        const res = await api.post('/admin/inventory/upload', {
          fornecedorId: parseInt(fornecedorId, 10),
          artigos
        });

        showToast(
          `Sincronização OK! Inseridos: ${res.data.inseridos}, Actualizados: ${res.data.actualizados}, Desactivados: ${res.data.desactivados}`,
          "success"
        );
      } catch (err: any) {
        showToast("Erro ao processar ficheiro de stock.", "error");
      } finally {
        setUploadLoading(false);
        // Clear input value so same file can be uploaded again
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Stats calculators
  const totalFaturadoHoje = pedidosAprovados.reduce((sum, p) => sum + (p.preco || 0), 0);

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
            <p className="text-sm text-slate-500 mt-1">Painel Administrativo de Encomendas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Palavra-passe de Acesso</label>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Insira a password do administrador"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {erroLogin && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{erroLogin}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all"
            >
              Entrar no Painel
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
          <h1 className="text-lg font-bold tracking-tight">Rede Peças — Gestão de Pedidos</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString('pt-AO')}
          </span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
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
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Métricas Rápidas</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Pedidos Pendentes</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{pedidosPendentes.length}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Aprovados Hoje</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{pedidosAprovados.length}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Faturação Diária</p>
                  <p className="text-xl font-bold text-emerald-700 mt-1">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(totalFaturadoHoje)}
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
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Carregar Inventário</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Seleccionar Fornecedor</label>
                <select 
                  value={fornecedorId}
                  onChange={(e) => setFornecedorId(e.target.value)}
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
                      {uploadLoading ? 'A processar ficheiro...' : 'Importar CSV ou Excel'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Carregar ficheiro com SKU, Artigo, Stock e Preço</p>
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
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">⏳ Pedidos Pendentes de Aprovação</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {pedidosPendentes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Não existem pedidos pendentes para aprovação. ✅
                </div>
              ) : (
                pedidosPendentes.map((pedido) => (
                  <div key={pedido.numero} className="p-6 hover:bg-slate-50/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-sm font-bold text-slate-800 mr-2">{pedido.numero}</span>
                        <span className="text-xs font-semibold text-slate-500">às {pedido.hora}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-2xs font-bold ${
                        pedido.tem_comprovativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {pedido.tem_comprovativo ? 'Comprovativo Recebido' : 'Aguardando Pagamento'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                      <div>
                        <p className="text-slate-400 font-medium">Peça</p>
                        <p className="font-bold text-slate-800 mt-0.5">{pedido.peca}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Referência SKU</p>
                        <p className="font-bold text-slate-800 mt-0.5">{pedido.referencia}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Fornecedor</p>
                        <p className="font-bold text-slate-800 mt-0.5">{pedido.fornecedor}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium">Preço</p>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(pedido.preco)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400 font-medium">Cliente (WhatsApp)</p>
                        <p className="font-bold text-slate-800 mt-0.5">{pedido.cliente}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => handleRejeitar(pedido.numero)}
                        className="flex-1 py-2 px-4 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-lg transition-all"
                      >
                        ❌ Rejeitar Pedido
                      </button>
                      <button 
                        onClick={() => handleAprovar(pedido.numero)}
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                      >
                        ✅ Confirmar Pagamento e Faturar
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
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">✅ Aprovados Hoje</h2>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {pedidosAprovados.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Nenhum pedido aprovado hoje ainda.
                </div>
              ) : (
                pedidosAprovados.map((pedido) => (
                  <div key={pedido.numero} className="p-4 flex items-center justify-between hover:bg-slate-50/20">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{pedido.numero}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{pedido.peca} · {pedido.cliente}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(pedido.preco)}
                      </p>
                      <p className="text-2xs font-semibold text-slate-400 mt-0.5">Aprovado às {pedido.hora}</p>
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
