import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { collection, addDoc, getDocs, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, Customer, AppSettings } from '../types';
import { Plus, Minus, ChevronDown, Share2, Printer, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PrinterLayout from './PrinterLayout';
import { toJpeg } from 'html-to-image';
import Receipt from './Receipt';

export default function TransactionForm() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [weights, setWeights] = useState<string[]>(['']);
  const [taraPercentage, setTaraPercentage] = useState<number>(3);
  const [pricePerKg, setPricePerKg] = useState<number>(0);
  const [footnote, setFootnote] = useState('');
  const [isDebt, setIsDebt] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedTx, setSavedTx] = useState<Transaction | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [jpegDataUrl, setJpegDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [customersSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, 'customers')),
          getDoc(doc(db, 'settings', 'default'))
        ]);
        const customersData = customersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        setCustomers(customersData.sort((a, b) => a.name.localeCompare(b.name)));
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }
      } catch (error) {
        console.error("Error loading initial data", error);
      }
    }
    loadInitialData();
  }, []);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCustomerId(val);
    if (!val) {
      setCustomerName('');
      return;
    }
    const selected = customers.find(c => c.id === val);
    if (selected) {
      setCustomerName(selected.name);
      setTaraPercentage(selected.defaultTara);
      setPricePerKg(selected.defaultPrice);
    }
  };

  const handleAddWeight = () => {
    if (weights.length < 25) {
      setWeights([...weights, '']);
    }
  };

  const handleRemoveWeight = (index: number) => {
    const newWeights = [...weights];
    newWeights.splice(index, 1);
    setWeights(newWeights);
  };

  const handleWeightChange = (index: number, value: string) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };

  const calculateTotals = () => {
    const validWeights = weights.map(w => parseFloat(w) || 0);
    const grossWeight = validWeights.reduce((a, b) => a + b, 0);
    const taraWeight = (grossWeight * taraPercentage) / 100;
    const netWeight = grossWeight - taraWeight;
    const totalPrice = netWeight * pricePerKg;

    return { grossWeight, taraWeight, netWeight, totalPrice, validWeights };
  };

  const saveTransaction = async (): Promise<Transaction | null> => {
    if (!customerName || pricePerKg <= 0) return null;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd');
      const timeStr = format(now, 'HH:mm');

      const { grossWeight, taraWeight, netWeight, totalPrice, validWeights } = calculateTotals();

      let finalCustomerId = customerId;

      if (!finalCustomerId) {
        const existing = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        if (existing) {
          finalCustomerId = existing.id!;
        } else {
          const newCustRef = await addDoc(collection(db, 'customers'), {
            name: customerName,
            defaultTara: taraPercentage,
            defaultPrice: pricePerKg,
            debtAmount: 0,
            createdAt: Date.now()
          });
          finalCustomerId = newCustRef.id;
        }
      }

      const transactionData: Omit<Transaction, 'id'> = {
        customerId: finalCustomerId,
        customerName,
        date: dateStr,
        time: timeStr,
        weights: validWeights,
        grossWeight,
        taraPercentage,
        taraWeight,
        netWeight,
        pricePerKg,
        totalPrice,
        footnote,
        isDebt,
        createdAt: Date.now()
      };

      const newTxRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      if (isDebt) {
        await updateDoc(doc(db, 'customers', finalCustomerId), {
          debtAmount: increment(totalPrice)
        });
        await addDoc(collection(db, 'payments'), {
          customerId: finalCustomerId,
          amount: totalPrice,
          type: 'debt',
          date: dateStr,
          time: timeStr,
          notes: `Utang dari transaksi ${dateStr}`,
          createdAt: Date.now()
        });
      }

      return { id: newTxRef.id, ...transactionData };
    } catch (error) {
      console.error('Error saving transaction: ', error);
      alert('Gagal menyimpan transaksi');
      setIsSubmitting(false);
      return null;
    }
  };

  const handleSaveOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tx = await saveTransaction();
    if (tx) {
      navigate('/reports');
    }
  };

  const handleSaveAndShare = async () => {
    const tx = await saveTransaction();
    if (tx) {
      setSavedTx(tx);
      setShowShareModal(true);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (showShareModal && savedTx && receiptRef.current) {
      generateJpeg();
    }
  }, [showShareModal, savedTx]);

  const generateJpeg = async () => {
    if (!receiptRef.current) return;
    setGenerating(true);
    try {
      await new Promise(res => setTimeout(res, 200));
      const dataUrl = await toJpeg(receiptRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      setJpegDataUrl(dataUrl);
    } catch (err) {
      console.error("Error generating JPEG", err);
    } finally {
      setGenerating(false);
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSavedTx(null);
    setJpegDataUrl(null);
    navigate('/reports');
  };

  const downloadImage = () => {
    if (!jpegDataUrl || !savedTx) return;
    const link = document.createElement('a');
    link.download = `struk-${savedTx.customerName}-${savedTx.id}.jpg`;
    link.href = jpegDataUrl;
    link.click();
  };

  const handleShareApp = async () => {
    if (!jpegDataUrl || !savedTx) return;
    try {
      const res = await fetch(jpegDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `struk-${savedTx.customerName}-${savedTx.id}.jpg`, { type: 'image/jpeg' });

      if (navigator.share) {
        await navigator.share({
          title: `Struk Penjualan - ${savedTx.customerName}`,
          text: `Struk Pembelian Lele - ${savedTx.customerName} - Total: Rp ${savedTx.totalPrice.toLocaleString('id-ID')}`,
          files: [file]
        });
      } else {
        downloadImage();
      }
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  const openWhatsApp = (phone?: string) => {
    if (!savedTx) return;
    let targetPhone = phone || '';
    if (targetPhone.startsWith('+')) {
      targetPhone = targetPhone.substring(1);
    } else if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.substring(1);
    }
    
    const text = `Nota Penjualan ${settings?.companyName || 'LELE SALES'}
Pelanggan: ${savedTx.customerName}
Berat Bersih: ${savedTx.netWeight.toFixed(2)} kg
Total Tagihan: Rp ${savedTx.totalPrice.toLocaleString('id-ID')}
Status: ${savedTx.isDebt ? 'BELUM LUNAS (UTANG)' : 'LUNAS'}

Terima kasih.`;

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${targetPhone}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const { grossWeight, taraWeight, netWeight, totalPrice } = calculateTotals();

  return (
    <PrinterLayout 
      title="Transaksi"
      actionButton={
        <>
          <div className="flex justify-between items-center px-4">
            <span className="text-[#8B847C] font-medium text-sm">Total Bayar</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              Rp {Math.floor(totalPrice).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              type="button"
              onClick={handleSaveOnly}
              disabled={isSubmitting || !customerName || pricePerKg <= 0}
              className="w-full bg-[#3D3935] text-white font-medium py-3 rounded-xl shadow hover:bg-[#2A2724] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : 'Simpan'}
            </button>
            <button 
              type="button"
              onClick={handleSaveAndShare}
              disabled={isSubmitting || !customerName || pricePerKg <= 0}
              className="w-full bg-emerald-500 text-white font-medium py-3 rounded-xl shadow hover:bg-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Bagikan
            </button>
          </div>
        </>
      }
    >
      <form id="transaction-form" className="flex-1 flex flex-col space-y-5">
        {/* Customer */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-sm text-slate-500 w-24">Pelanggan</label>
              <div className="flex-1 flex items-center justify-end gap-2">
                <input 
                  type="text"
                  required
                  className="w-full text-right bg-transparent text-slate-800 font-medium focus:outline-none placeholder:text-slate-300"
                  placeholder="Ketik Nama..."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
                <div className="relative flex-shrink-0">
                  <select 
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    onChange={handleCustomerSelect}
                    title="Pilih dari buku pelanggan"
                  >
                    <option value="">Pilih</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="bg-slate-100 text-slate-600 p-1.5 rounded flex items-center pointer-events-none">
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Weights */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm text-slate-500">Timbangan (kg)</label>
                {weights.length < 25 && (
                  <button type="button" onClick={handleAddWeight} className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1.5 rounded-full font-medium transition-colors hover:bg-emerald-100">
                    + Tambah
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                 {weights.map((w, index) => (
                   <div key={index} className="flex items-center justify-between">
                     <span className="text-xs font-mono text-slate-400 w-8">#{index+1}</span>
                     <input 
                        type="number" step="0.01" min="0" required
                        className="flex-1 text-right bg-slate-50 px-3 py-1.5 rounded-lg text-slate-800 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-200"
                        value={w} onChange={e => handleWeightChange(index, e.target.value)}
                        placeholder="0.00"
                     />
                     {weights.length > 1 && (
                       <button type="button" onClick={() => handleRemoveWeight(index)} className="ml-2 text-red-400 hover:text-red-600 p-1">
                         <Minus className="w-4 h-4" />
                       </button>
                     )}
                   </div>
                 ))}
              </div>
            </div>

            {/* Tara & Harga */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <label className="text-sm text-slate-500">Potongan Tara</label>
              <div className="flex items-center gap-1">
                <input 
                  type="number" step="0.1" min="0" required
                  className="w-16 text-right bg-transparent text-slate-800 font-mono focus:outline-none"
                  value={taraPercentage} onChange={e => setTaraPercentage(parseFloat(e.target.value) || 0)}
                />
                <span className="text-slate-400 text-sm">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <label className="text-sm text-slate-500">Harga/kg</label>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-sm">Rp</span>
                <input 
                  type="number" min="0" required
                  className="w-24 text-right bg-transparent text-slate-800 font-mono focus:outline-none"
                  value={pricePerKg || ''} onChange={e => setPricePerKg(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Footnote */}
            <div className="flex flex-col pb-4 border-b border-slate-100">
              <label className="text-sm text-slate-500 mb-1">Catatan</label>
              <input 
                type="text" 
                className="w-full bg-transparent text-slate-800 text-sm focus:outline-none placeholder:text-slate-300"
                placeholder="Opsional (Misal: Lunas transfer)"
                value={footnote} onChange={e => setFootnote(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={isDebt}
                  onChange={(e) => setIsDebt(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                Catat sebagai Utang
              </label>
            </div>

            <div className="flex-1"></div>

            {/* Receipt Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Bruto: {grossWeight.toFixed(2)} kg</span>
                <span>Tara: {taraWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm text-slate-600 font-medium">Netto</span>
                <span className="text-lg font-mono font-bold text-slate-800">{netWeight.toFixed(2)} kg</span>
              </div>
            </div>
          </form>

      {/* Share Modal */}
      {showShareModal && savedTx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Bagikan Transaksi</h3>
              <button 
                onClick={closeShareModal}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 overflow-y-auto flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div ref={receiptRef}>
                  <Receipt tx={savedTx} settings={settings} />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white space-y-3">
              {generating ? (
                <div className="text-center text-sm text-slate-500 py-4 animate-pulse">
                  Menyiapkan struk...
                </div>
              ) : (
                <>
                  {settings?.adminPhones && settings.adminPhones.split(',').map((phone, i) => {
                    const cleanPhone = phone.trim();
                    if (!cleanPhone) return null;
                    return (
                      <button
                        key={i}
                        onClick={() => openWhatsApp(cleanPhone)}
                        className="w-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> WA Admin ({cleanPhone})
                      </button>
                    );
                  })}
                  
                  {savedTx.customerId && (
                    <button
                      onClick={() => {
                        const cust = customers.find(c => c.id === savedTx.customerId);
                        if (cust?.phone) openWhatsApp(cust.phone);
                        else openWhatsApp();
                      }}
                      className="w-full bg-emerald-500 text-white hover:bg-emerald-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Share2 className="w-4 h-4" /> WA Pelanggan
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleShareApp}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Share2 className="w-4 h-4" /> Bagikan File
                    </button>
                    <button
                      onClick={downloadImage}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> Unduh
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Struk
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PrinterLayout>
  );
}
