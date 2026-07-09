import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, AppSettings } from '../types';
import { format, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ReceiptText, Calendar, X, Share2, Download, Printer } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import Receipt from './Receipt';
import PrinterLayout from './PrinterLayout';

export default function Reports() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  // Modal state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [jpegDataUrl, setJpegDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsSnap, txSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'default')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50)))
        ]);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }

        const data = txSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (selectedTx && receiptRef.current) {
      generateJpeg();
    }
  }, [selectedTx]);

  const generateJpeg = async () => {
    if (!receiptRef.current) return;
    setGenerating(true);
    try {
      // Allow react to render the component fully
      await new Promise(res => setTimeout(res, 200));
      const dataUrl = await toJpeg(receiptRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      setJpegDataUrl(dataUrl);
    } catch (err) {
      console.error("Error generating JPEG", err);
    } finally {
      setGenerating(false);
    }
  };

  const closeModal = () => {
    setSelectedTx(null);
    setJpegDataUrl(null);
  };

  const handleShare = async () => {
    if (!jpegDataUrl || !selectedTx) return;
    
    try {
      const res = await fetch(jpegDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `struk-${selectedTx.customerName}-${selectedTx.id}.jpg`, { type: 'image/jpeg' });

      if (navigator.share) {
        await navigator.share({
          title: `Struk Penjualan - ${selectedTx.customerName}`,
          text: `Struk Pembelian Lele - ${selectedTx.customerName} - Total: Rp ${selectedTx.totalPrice.toLocaleString('id-ID')}`,
          files: [file]
        });
      } else {
        downloadImage();
      }
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  const downloadImage = () => {
    if (!jpegDataUrl || !selectedTx) return;
    const link = document.createElement('a');
    link.download = `struk-${selectedTx.customerName}-${selectedTx.id}.jpg`;
    link.href = jpegDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const totalToday = transactions
    .filter(t => isToday(new Date(t.date)))
    .reduce((sum, t) => sum + t.totalPrice, 0);

  return (
    <PrinterLayout 
      title="Laporan Penjualan" 
      printerWidth="max-w-[1000px]" 
      receiptWidth="max-w-[940px]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-8">
        <div className="bg-[#3D3935] text-white px-5 py-3 rounded-2xl shadow-[0_8px_20px_rgba(61,57,53,0.6)] border border-[#2A2724]">
          <div className="text-sm text-[#EBE2D9] mb-0.5 font-medium">Pendapatan Hari Ini</div>
          <div className="text-xl font-bold tracking-tight">Rp {totalToday.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#A39B91]">Memuat data...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-12 h-12 text-[#E5E0D8] mx-auto mb-3" />
            <p className="text-[#A39B91] font-medium">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#8B847C]">
              <thead className="bg-[#F4ECE4] text-[#4A4540] font-semibold border-b border-[#E5E0D8]">
                <tr>
                  <th className="px-6 py-4">Tanggal & Waktu</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4 text-right">Berat Bersih</th>
                  <th className="px-6 py-4 text-right">Harga/kg</th>
                  <th className="px-6 py-4 text-right">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {transactions.map(trx => (
                  <tr 
                    key={trx.id} 
                    onClick={() => setSelectedTx(trx)}
                    className="hover:bg-[#F4ECE4]/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#A39B91]" />
                        <div>
                          <div className="font-medium text-[#4A4540]">
                            {format(new Date(trx.date), 'dd MMM yyyy', { locale: idLocale })}
                          </div>
                          <div className="text-xs text-[#A39B91]">{trx.time} WIB</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#4A4540]">
                      {trx.customerName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trx.netWeight.toFixed(2)} kg
                      <div className="text-xs text-[#A39B91]">Tara {trx.taraPercentage}%</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      Rp {trx.pricePerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#4A4540]">
                      Rp {Math.floor(trx.totalPrice).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL STRUK */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-h-full overflow-hidden flex flex-col w-full max-w-lg">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Nota Transaksi</h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[400px] bg-slate-200/50">
              {/* HIDDEN ACTUAL RECEIPT COMPONENT FOR HTML-TO-IMAGE */}
              <div className="absolute top-[-9999px] left-[-9999px]">
                <Receipt ref={receiptRef} transaction={selectedTx} settings={settings} />
              </div>

              {generating ? (
                <div className="text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">Memproses nota JPEG...</p>
                </div>
              ) : jpegDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={jpegDataUrl} alt="Struk JPEG" className="w-[400px] max-w-full h-auto shadow-md rounded-lg border border-slate-200" />
                  <p className="text-[10px] text-slate-400 mt-1">Tekan & tahan gambar untuk menyimpan manual jika tombol gagal</p>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-3 gap-3">
              <button
                onClick={handlePrint}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button
                onClick={downloadImage}
                disabled={!jpegDataUrl}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Unduh
              </button>
              <button
                onClick={handleShare}
                disabled={!jpegDataUrl}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" /> WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}
    </PrinterLayout>
  );
}
