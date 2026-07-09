import React, { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, getDocs, limit, doc, getDoc, where, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Transaction, AppSettings, Payment } from '../types';

type ReportItem = { type: 'transaction', data: Transaction } | { type: 'payment', data: Payment };
import { format, isToday } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ReceiptText, Camera, Calendar, X, Share2, Download, Printer, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { toJpeg } from 'html-to-image';
import Receipt from './Receipt';
import PaymentReceipt from './PaymentReceipt';
import PrinterLayout from './PrinterLayout';



const ReportItemRow = ({ item, onEdit, onDelete, onClick }: { 
  item: ReportItem, 
  onEdit: (item: ReportItem) => void, 
  onDelete: (item: ReportItem) => void,
  onClick: (item: ReportItem) => void 
}) => {
  const controls = useAnimation();
  const isDragging = useRef(false);
  const dragDist = useRef(0);
  
  const handleDragStart = () => {
    isDragging.current = true;
    dragDist.current = 0;
  };

  const handleDrag = (event: any, info: PanInfo) => {
    dragDist.current = Math.abs(info.offset.x);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setTimeout(() => {
      isDragging.current = false;
    }, 50);

    const threshold = 30; // Very responsive
    if (info.offset.x > threshold) {
      onEdit(item);
      controls.start({ x: 0 });
    } else if (info.offset.x < -threshold) {
      onDelete(item);
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
  };

  const isTx = item.type === 'transaction';
  const data = item.data;

  const handleClick = (e: any) => {
    if (!isDragging.current || dragDist.current < 5) {
      onClick(item);
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
        onClick={handleClick}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        className="relative bg-[#FDFBF7] px-4 py-3 hover:bg-[#F4ECE4]/50 transition-colors z-10 w-full cursor-pointer"
      >
        <div className="w-full pointer-events-none">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[#4A4540]">{format(new Date(data.date), 'dd MMM yyyy')}</span>
              <span className="text-[#A39B91] text-xs">{data.time}</span>
            </div>
            <div className="font-bold text-sm text-[#4A4540]">
              Rp {isTx ? (data as Transaction).totalPrice.toLocaleString('id-ID') : (data as Payment).amount.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
             <div className="text-sm text-[#8B847C]">
               {isTx ? (data as Transaction).customerName : (data as Payment).notes || 'Pembayaran Piutang'}
             </div>
             {!isTx && (data as Payment).photoUrl && (
               <span className="text-[#A39B91]"><Camera className="w-4 h-4"/></span>
             )}
          </div>
          {isTx && (
             <div className="text-xs text-[#8B847C] flex gap-3 mt-1">
               <span>Net: {(data as Transaction).netWeight.toFixed(2)}kg</span>
               <span>@Rp {(data as Transaction).pricePerKg.toLocaleString('id-ID')}</span>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function Reports() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [undoState, setUndoState] = useState<{ item: ReportItem | null, timeoutId: NodeJS.Timeout | null }>({ item: null, timeoutId: null });

  
  // Modal state
  const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jpegDataUrl, setJpegDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsSnap, txSnap, paySnap, custSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'default')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'payments'), where('type', '==', 'payment'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(collection(db, 'customers'))
        ]);
        
        const custData = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(custData);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }

        const txData = txSnap.docs.map(doc => ({
          type: 'transaction' as const,
          data: { id: doc.id, ...doc.data() } as Transaction
        }));
        
        const payData = paySnap.docs.map(doc => ({
          type: 'payment' as const,
          data: { id: doc.id, ...doc.data() } as Payment
        }));
        
        const combined = [...txData, ...payData].sort((a, b) => b.data.createdAt - a.data.createdAt).slice(0, 50);
        setItems(combined);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (selectedItem && receiptRef.current) {
      generateJpeg();
    }
  }, [selectedItem]);

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
    setSelectedItem(null);
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
    } catch (error: any) {
      console.error('Error sharing image:', error);
      if (error.name !== 'AbortError') {
        downloadImage();
      }
    }
  };

  const downloadImage = () => {
    if (!jpegDataUrl || !selectedTx) return;
    const link = document.createElement('a');
    link.download = `struk-${selectedTx.customerName}-${selectedTx.id}.jpg`;
    link.href = jpegDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };


  const handleEditItem = (item: ReportItem) => {
    if (item.type === 'transaction') {
      navigate('/', { state: { editTx: item.data } });
    } else {
      alert('Pengeditan pembayaran piutang dapat dilakukan di menu Pelanggan.');
    }
  };

    const commitDelete = async (item: ReportItem) => {
    try {
      if (item.type === 'transaction') {
        await deleteDoc(doc(db, 'transactions', item.data.id!));
        if (item.data.isDebt && item.data.customerId) {
          await updateDoc(doc(db, 'customers', item.data.customerId), {
            debtAmount: increment(-item.data.totalPrice)
          });
        }
      } else {
        await deleteDoc(doc(db, 'payments', item.data.id!));
        await updateDoc(doc(db, 'customers', item.data.customerId), {
          debtAmount: increment(item.data.amount)
        });
      }
    } catch (err) {
      console.error('Gagal menghapus data', err);
    }
  };

  const handleDeleteItem = (item: ReportItem) => {
    setItems(prev => prev.filter(i => i.data.id !== item.data.id));
    if (undoState.timeoutId) {
      clearTimeout(undoState.timeoutId);
      if (undoState.item) commitDelete(undoState.item);
    }
    const tId = setTimeout(() => {
      commitDelete(item);
      setUndoState({ item: null, timeoutId: null });
    }, 5000);
    setUndoState({ item, timeoutId: tId });
  };

  const handleUndo = () => {
    if (undoState.timeoutId) clearTimeout(undoState.timeoutId);
    if (undoState.item) {
      setItems(prev => {
        const newItems = [...prev, undoState.item!];
        newItems.sort((a, b) => b.data.createdAt - a.data.createdAt);
        return newItems;
      });
    }
    setUndoState({ item: null, timeoutId: null });
  };

  const handleItemClick = (item: ReportItem) => {
    setJpegDataUrl(null);
    setSelectedItem(item);
  };

  const totalToday = items
    .filter(i => isToday(new Date(i.data.date)))
    .reduce((sum, i) => {
      if (i.type === 'transaction') {
        if (i.data.isDebt) return sum;
        return sum + i.data.totalPrice;
      } else {
        return sum + i.data.amount;
      }
    }, 0);


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
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptText className="w-12 h-12 text-[#E5E0D8] mx-auto mb-3" />
            <p className="text-[#A39B91] font-medium">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-2 text-center text-xs text-[#8B847C] bg-amber-50 border-b border-amber-100">
              <span className="hidden sm:inline">Geser baris ke <strong>kiri</strong> untuk hapus, geser ke <strong>kanan</strong> untuk edit.</span>
              <span className="sm:hidden">Geser baris ke <strong>kiri</strong> (hapus), ke <strong>kanan</strong> (edit).</span>
            </div>
            {items.map(item => (
              <ReportItemRow
                key={item.data.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>

      

      {/* MODAL STRUK */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 hide-nav">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-h-full overflow-hidden flex flex-col w-full max-w-lg">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">{selectedItem?.type === 'transaction' ? 'Nota Transaksi' : 'Nota Mutasi'}</h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[400px] bg-slate-200/50">
              {/* HIDDEN ACTUAL RECEIPT COMPONENT FOR HTML-TO-IMAGE */}
              <div className="absolute top-[-9999px] left-[-9999px]">
                {selectedItem.type === 'transaction' ? (
                  <Receipt ref={receiptRef} transaction={selectedItem.data as any} settings={settings} />
                ) : (
                  <PaymentReceipt 
                    ref={receiptRef} 
                    payment={selectedItem.data as any} 
                    settings={settings} 
                    customer={customers.find((c: any) => c.id === (selectedItem.data as any).customerId)} 
                  />
                )}
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

                        <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    closeModal();
                    handleEditItem(selectedItem!);
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Nota
                </button>
                <button
                  onClick={closeModal}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Tutup Nota
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
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
        </div>
      )}
    </PrinterLayout>
  );
}
