import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer, Transaction, Payment, AppSettings } from '../types';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, Camera, Receipt, Clock, Trash2, Edit2, Share2, Printer, Download, X } from 'lucide-react';
import { compressImage } from '../lib/utils';
import PrinterLayout from './PrinterLayout';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { toJpeg } from 'html-to-image';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'debts'>('transactions');

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentPhotoUrl, setPaymentPhotoUrl] = useState('');
  const [paymentType, setPaymentType] = useState<'payment' | 'debt'>('payment');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentSort, setPaymentSort] = useState<'date-desc' | 'date-asc' | 'type'>('date-desc');
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [jpegDataUrl, setJpegDataUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  async function loadCustomerData() {
    setLoading(true);
    try {
      // 1. Get customer
      const custSnap = await getDoc(doc(db, 'customers', id!));
      if (custSnap.exists()) {
        setCustomer({ id: custSnap.id, ...custSnap.data() } as Customer);
      }
      
      const setSnap = await getDoc(doc(db, 'settings', 'default'));
      if (setSnap.exists()) {
        setSettings(setSnap.data() as AppSettings);
      }

      // 2. Get transactions
      const txQuery = query(
        collection(db, 'transactions'),
        where('customerId', '==', id!),
        orderBy('createdAt', 'desc')
      );
      const txSnap = await getDocs(txQuery);
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      // 3. Get payments
      const pmQuery = query(
        collection(db, 'payments'),
        where('customerId', '==', id!),
        orderBy('createdAt', 'desc')
      );
      const pmSnap = await getDocs(pmQuery);
      setPayments(pmSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
    } catch (error) {
      console.error("Error loading customer data", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || parseInt(paymentAmount) <= 0) return;
    
    setIsSubmitting(true);
    const amountNum = parseInt(paymentAmount);
    
    try {
      const now = new Date();
      
      let debtChange = paymentType === 'debt' ? amountNum : -amountNum;
      
      if (editingPaymentId) {
        // Find old payment to revert its effect
        const oldPayment = payments.find(p => p.id === editingPaymentId);
        if (oldPayment) {
          const oldDebtChange = oldPayment.type === 'debt' ? oldPayment.amount : -oldPayment.amount;
          debtChange = debtChange - oldDebtChange;
        }
        
        await updateDoc(doc(db, 'payments', editingPaymentId), {
          amount: amountNum,
          type: paymentType,
          date: paymentDate,
          notes: paymentNotes,
          photoUrl: paymentPhotoUrl
        });
      } else {
        await addDoc(collection(db, 'payments'), {
          customerId: id,
          amount: amountNum,
          type: paymentType,
          date: paymentDate,
          time: format(now, 'HH:mm'),
          notes: paymentNotes,
          photoUrl: paymentPhotoUrl,
          createdAt: Date.now()
        });
      }

      if (debtChange !== 0) {
        await updateDoc(doc(db, 'customers', id!), {
          debtAmount: increment(debtChange)
        });
      }

      setShowPaymentForm(false);
      setEditingPaymentId(null);
      setPaymentAmount('');
      setPaymentNotes('');
      setPaymentPhotoUrl('');
      setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
      loadCustomerData(); // Reload data
    } catch (error) {
      console.error("Error saving payment", error);
      alert("Gagal menyimpan pembayaran");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (p: Payment) => {
    if (!confirm('Hapus mutasi/pembayaran ini?')) return;
    try {
      await deleteDoc(doc(db, 'payments', p.id!));
      const debtChange = p.type === 'debt' ? -p.amount : p.amount;
      await updateDoc(doc(db, 'customers', id!), {
        debtAmount: increment(debtChange)
      });
      loadCustomerData();
    } catch (error) {
      console.error("Error deleting payment", error);
      alert("Gagal menghapus pembayaran");
    }
  };

  const handleEditPayment = (p: Payment) => {
    setEditingPaymentId(p.id!);
    setPaymentAmount(p.amount.toString());
    setPaymentType(p.type);
    setPaymentDate(p.date);
    setPaymentNotes(p.notes || '');
    setPaymentPhotoUrl(p.photoUrl || '');
    setShowPaymentForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortedPayments = useMemo(() => {
    const arr = [...payments];
    if (paymentSort === 'date-desc') {
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
    } else if (paymentSort === 'date-asc') {
      arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt);
    } else if (paymentSort === 'type') {
      arr.sort((a, b) => a.type.localeCompare(b.type) || new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return arr;
  }, [payments, paymentSort]);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenShareModal = () => {
    setShowShareModal(true);
  };

  useEffect(() => {
    if (showShareModal && reportRef.current) {
      generateJpeg();
    }
  }, [showShareModal]);

  const generateJpeg = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      await new Promise(res => setTimeout(res, 200));
      const dataUrl = await toJpeg(reportRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      setJpegDataUrl(dataUrl);
    } catch (err) {
      console.error("Error generating JPEG", err);
      alert("Gagal membuat gambar laporan");
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!jpegDataUrl || !customer) return;
    const link = document.createElement('a');
    link.download = `Laporan-Piutang-${customer.name}.jpg`;
    link.href = jpegDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareApp = async () => {
    if (!jpegDataUrl || !customer) return;
    try {
      const res = await fetch(jpegDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Laporan-Piutang-${customer.name}.jpg`, { type: 'image/jpeg' });

      if (navigator.share) {
        await navigator.share({
          title: `Laporan Piutang - ${customer.name}`,
          text: `Laporan Piutang/Mutasi ${customer.name}`,
          files: [file]
        });
      } else {
        downloadImage();
      }
    } catch (error: any) {
      console.error('Error sharing image:', error);
      if (error.name !== 'AbortError') {
        downloadImage();
      }
    }
  };

  const openWhatsApp = (phone?: string) => {
    if (!customer) return;
    let targetPhone = phone || '';
    if (targetPhone.startsWith('+')) {
      targetPhone = targetPhone.substring(1);
    } else if (targetPhone.startsWith('0')) {
      targetPhone = '62' + targetPhone.substring(1);
    }
    
    const text = `Laporan Piutang & Mutasi ${settings?.companyName || 'LELE SALES'}
Pelanggan: ${customer.name}
Total Piutang Saat Ini: Rp ${(customer.debtAmount || 0).toLocaleString('id-ID')}

Terima kasih.`;

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${targetPhone}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <PrinterLayout title="Detail Pelanggan" printerWidth="max-w-[800px]" receiptWidth="max-w-[740px]">
        <div className="p-8 text-center text-[#A39B91]">Memuat data pelanggan...</div>
      </PrinterLayout>
    );
  }

  if (!customer) {
    return (
      <PrinterLayout title="Detail Pelanggan" printerWidth="max-w-[800px]" receiptWidth="max-w-[740px]">
        <div className="p-8 text-center text-[#A39B91]">Pelanggan tidak ditemukan.</div>
      </PrinterLayout>
    );
  }

  return (
    <PrinterLayout 
      title={`Detail: ${customer.name}`}
      printerWidth="max-w-[800px]" 
      receiptWidth="max-w-[740px]"
      actionButton={
        <div className="flex justify-center">
          <Link to="/customers" className="px-6 py-3 bg-[#E5E0D8] text-[#4A4540] hover:bg-[#D4CEC5] rounded-xl font-medium transition-colors flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </Link>
        </div>
      }
    >
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#4A4540]">{customer.name}</h2>
          <p className="text-sm text-[#A39B91]">Total Utang: <span className="font-semibold text-red-600">Rp {customer.debtAmount ? customer.debtAmount.toLocaleString('id-ID') : '0'}</span></p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#E5E0D8] mb-6">
        <button 
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-[#4A4540] text-[#4A4540]' : 'border-transparent text-[#A39B91] hover:text-[#4A4540]'}`}
        >
          <Receipt className="w-4 h-4 inline-block mr-2" />
          Riwayat Penjualan
        </button>
        <button 
          onClick={() => setActiveTab('debts')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'debts' ? 'border-[#4A4540] text-[#4A4540]' : 'border-transparent text-[#A39B91] hover:text-[#4A4540]'}`}
        >
          <Clock className="w-4 h-4 inline-block mr-2" />
          Mutasi Utang / Pembayaran
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-[#A39B91]">Belum ada transaksi penjualan</div>
          ) : (
            <table className="w-full text-left text-sm text-[#8B847C]">
              <thead className="bg-[#F4ECE4] text-[#4A4540] font-semibold border-b border-[#E5E0D8]">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Bruto</th>
                  <th className="px-6 py-4">Netto</th>
                  <th className="px-6 py-4">Harga/kg</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-[#F4ECE4]/50 transition-colors">
                    <td className="px-6 py-4">{format(new Date(t.date), 'dd MMM yyyy')} <span className="text-[#A39B91] text-xs ml-1">{t.time}</span></td>
                    <td className="px-6 py-4">{t.grossWeight.toFixed(2)} kg</td>
                    <td className="px-6 py-4">{t.netWeight.toFixed(2)} kg</td>
                    <td className="px-6 py-4">Rp {t.pricePerKg.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-[#4A4540]">Rp {t.totalPrice.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="bg-[#3D3935] hover:bg-[#2A2724] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Catat Mutasi Piutang / Pembayaran
            </button>
          </div>

          {showPaymentForm && (
            <div className="bg-[#EBE2D9] rounded-2xl p-6 border border-[#E3D9CE] mb-6">
              <h3 className="font-semibold text-[#4A4540] mb-4">Input Mutasi Baru</h3>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#4A4540] cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentType" 
                        value="payment" 
                        checked={paymentType === 'payment'} 
                        onChange={() => setPaymentType('payment')}
                        className="w-4 h-4 text-[#3D3935]"
                      />
                      Pembayaran Cicilan (Mengurangi Piutang)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-[#4A4540] cursor-pointer">
                      <input 
                        type="radio" 
                        name="paymentType" 
                        value="debt" 
                        checked={paymentType === 'debt'} 
                        onChange={() => setPaymentType('debt')}
                        className="w-4 h-4 text-[#3D3935]"
                      />
                      Tambah Utang (Menambah Piutang)
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B847C] mb-1">Tanggal</label>
                    <input 
                      type="date" 
                      required
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20 focus:border-[#8B847C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B847C] mb-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20 focus:border-[#8B847C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#8B847C] mb-1">Catatan</label>
                    <input 
                      type="text" 
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20 focus:border-[#8B847C]"
                      placeholder="Contoh: Transfer BCA"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#8B847C] mb-1">Bukti (Opsional - URL atau Upload)</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={paymentPhotoUrl}
                        onChange={e => setPaymentPhotoUrl(e.target.value)}
                        placeholder="Tempel URL gambar di sini..."
                        className="flex-1 px-4 py-2 rounded-xl border border-[#E5E0D8] bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20 focus:border-[#8B847C] text-sm"
                      />
                      <span className="text-[#8B847C] text-sm self-center">atau</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const compressed = await compressImage(file, 800);
                            setPaymentPhotoUrl(compressed);
                          } catch (error) {
                            console.error("Failed to compress", error);
                            alert("Gagal memproses gambar");
                          }
                        }}
                        className="block w-full sm:w-auto text-sm text-[#8B847C] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E5E0D8] file:text-[#4A4540] hover:file:bg-[#D4CEC5] transition-all"
                      />
                    </div>
                    {paymentPhotoUrl && (
                      <div className="mt-2">
                        <img src={paymentPhotoUrl} alt="Preview Bukti" className="h-20 object-contain rounded-lg border border-[#E5E0D8]" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 text-sm font-medium text-[#8B847C] hover:bg-[#D4CEC5] bg-[#E5E0D8] rounded-xl"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#3D3935] hover:bg-[#2A2724] rounded-xl"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Mutasi'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] overflow-hidden">
            <div className="p-4 border-b border-[#E5E0D8] flex flex-wrap gap-4 justify-between items-center bg-[#F4ECE4]/30">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#8B847C]">Urutkan:</label>
                <select 
                  value={paymentSort} 
                  onChange={e => setPaymentSort(e.target.value as any)}
                  className="text-sm bg-white border border-[#E5E0D8] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20"
                >
                  <option value="date-desc">Tanggal (Terbaru)</option>
                  <option value="date-asc">Tanggal (Terlama)</option>
                  <option value="type">Tipe Mutasi</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex items-center gap-1.5 text-sm font-medium text-[#4A4540] bg-white border border-[#E5E0D8] px-3 py-1.5 rounded-lg hover:bg-[#F4ECE4] transition-colors">
                  <Printer className="w-4 h-4" /> Cetak
                </button>
                <button onClick={handleOpenShareModal} className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                  <Share2 className="w-4 h-4" /> Bagikan
                </button>
              </div>
            </div>

            <div className="p-2 text-center text-xs text-[#8B847C] bg-amber-50 border-b border-amber-100">
              <span className="hidden sm:inline">Geser baris ke <strong>kiri</strong> untuk hapus, geser ke <strong>kanan</strong> untuk edit.</span>
              <span className="sm:hidden">Geser baris ke <strong>kiri</strong> (hapus), ke <strong>kanan</strong> (edit).</span>
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-[#A39B91]">Belum ada mutasi utang / pembayaran</div>
            ) : (
              <div className="flex flex-col">
                {sortedPayments.map(p => (
                  <PaymentRow 
                    key={p.id} 
                    p={p} 
                    onEdit={handleEditPayment} 
                    onDelete={handleDeletePayment} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 hide-nav">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Bagikan Laporan</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-200/50 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <div className="absolute top-[-9999px] left-[-9999px]">
                <div ref={reportRef} className="w-[400px] p-6 bg-white text-slate-800 font-sans">
                  <div className="text-center mb-6 border-b-2 border-dashed border-slate-200 pb-4">
                    <h2 className="text-xl font-bold tracking-tight uppercase text-slate-900">{settings?.companyName || 'LELE SALES'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Laporan Mutasi Piutang</p>
                  </div>
                  
                  <div className="mb-6 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Pelanggan:</span>
                      <span className="font-semibold">{customer?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Dicetak:</span>
                      <span className="font-medium">{format(new Date(), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mb-4">
                    {sortedPayments.map(p => (
                      <div key={p.id} className="flex justify-between items-start mb-3 text-sm">
                        <div>
                          <div className="font-medium">{format(new Date(p.date), 'dd MMM yyyy')}</div>
                          <div className="text-xs text-slate-500">{p.type === 'debt' ? 'Utang Baru' : 'Pembayaran'} {p.notes ? `- ${p.notes}` : ''}</div>
                        </div>
                        <div className={`font-semibold ${p.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {p.type === 'debt' ? '+' : '-'} {p.amount.toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-dashed border-slate-200 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-700">Total Piutang:</span>
                      <span className="text-xl font-black text-slate-900">Rp {(customer?.debtAmount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {generating ? (
                <div className="text-slate-500 flex flex-col items-center gap-3 py-10">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">Memproses laporan JPEG...</p>
                </div>
              ) : jpegDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={jpegDataUrl} alt="Laporan JPEG" className="w-[400px] max-w-full h-auto shadow-md rounded-lg border border-slate-200" />
                  <p className="text-[10px] text-slate-400 mt-1">Tekan & tahan gambar untuk menyimpan manual jika tombol gagal</p>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white space-y-3">
              {generating ? null : (
                <>
                  <button onClick={() => openWhatsApp(customer?.phone)} className="w-full bg-emerald-500 text-white hover:bg-emerald-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <Share2 className="w-4 h-4" /> WA Pelanggan
                  </button>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={handleShareApp} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                      <Share2 className="w-4 h-4" /> Bagikan File
                    </button>
                    <button onClick={downloadImage} className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                      <Download className="w-4 h-4" /> Unduh JPG
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PrinterLayout>
  );
}

const PaymentRow = ({ p, onEdit, onDelete }: { key?: string | number, p: Payment, onEdit: (p: Payment) => void, onDelete: (p: Payment) => void }) => {
  const controls = useAnimation();
  
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 30; // Very responsive
    if (info.offset.x > threshold) {
      onEdit(p);
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      onDelete(p);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative border-b border-[#E5E0D8] overflow-hidden group bg-slate-100">
      <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none">
        <div className="text-blue-600 font-medium flex items-center gap-2"><Edit2 className="w-5 h-5"/> Edit</div>
        <div className="text-red-500 font-medium flex items-center gap-2">Hapus <Trash2 className="w-5 h-5"/></div>
      </div>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="relative bg-[#FDFBF7] px-4 py-3 hover:bg-[#F4ECE4]/50 transition-colors z-10 w-full cursor-pointer"
      >
        <div className="w-full pointer-events-none">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[#4A4540]">{format(new Date(p.date), 'dd MMM yyyy')}</span>
              <span className="text-[#A39B91] text-xs">{p.time}</span>
            </div>
            <div className={`font-bold text-sm pointer-events-none ${p.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
              {p.type === 'debt' ? '+' : '-'} Rp {p.amount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
             <div className="text-sm text-[#8B847C]">
               {p.notes || (p.type === 'payment' ? 'Pembayaran' : 'Utang')}
             </div>
             {p.photoUrl && (
               <a href={p.photoUrl} target="_blank" rel="noreferrer" className="text-[#A39B91] hover:text-[#8B847C] transition-colors pointer-events-auto flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                 <Camera className="w-4 h-4" />
               </a>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
