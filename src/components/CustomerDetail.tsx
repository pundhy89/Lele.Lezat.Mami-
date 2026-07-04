import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer, Transaction, Payment } from '../types';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, Camera, Receipt, Clock } from 'lucide-react';
import { compressImage } from '../lib/utils';
import PrinterLayout from './PrinterLayout';

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

      const debtChange = paymentType === 'debt' ? amountNum : -amountNum;

      await updateDoc(doc(db, 'customers', id!), {
        debtAmount: increment(debtChange)
      });

      setShowPaymentForm(false);
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
                      {t.isDebt ? (
                        <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-semibold">Utang</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold">Lunas</span>
                      )}
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
            {payments.length === 0 ? (
              <div className="p-8 text-center text-[#A39B91]">Belum ada mutasi utang / pembayaran</div>
            ) : (
              <table className="w-full text-left text-sm text-[#8B847C]">
                <thead className="bg-[#F4ECE4] text-[#4A4540] font-semibold border-b border-[#E5E0D8]">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Tipe</th>
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Catatan</th>
                    <th className="px-6 py-4">Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-[#F4ECE4]/50 transition-colors">
                      <td className="px-6 py-4">{format(new Date(p.date), 'dd MMM yyyy')} <span className="text-[#A39B91] text-xs ml-1">{p.time}</span></td>
                      <td className="px-6 py-4">
                        {p.type === 'debt' ? (
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-semibold">Penambahan Utang</span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold">Pembayaran Masuk</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${p.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {p.type === 'debt' ? '+' : '-'} Rp {p.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4">{p.notes || '-'}</td>
                      <td className="px-6 py-4">
                        {p.photoUrl ? (
                          <a href={p.photoUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                            <Camera className="w-4 h-4" /> Lihat
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </PrinterLayout>
  );
}
