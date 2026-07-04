import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Transaction, AppSettings } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  settings: AppSettings | null;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ transaction, settings }, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-[#fdfaf6] w-[400px] p-8 text-slate-800 font-sans shadow-sm relative overflow-hidden"
      style={{
        // Receipt paper texture effect
        backgroundImage: `
          linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.02) 100%),
          linear-gradient(transparent 95%, rgba(0,0,0,0.02) 100%)
        `,
        backgroundSize: '20px 20px',
      }}
    >
      {/* Jagged top edge effect */}
      <div className="absolute top-0 left-0 right-0 h-2" style={{
        background: 'linear-gradient(135deg, transparent 50%, #fdfaf6 50%) -10px 0, linear-gradient(-135deg, transparent 50%, #fdfaf6 50%) -10px 0',
        backgroundSize: '20px 10px',
        backgroundRepeat: 'repeat-x',
        transform: 'rotate(180deg)'
      }}></div>

      <div className="text-center mb-6 pt-4">
        {settings?.logoUrl && (
          <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-3" />
        )}
        <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
          {settings?.companyName || 'LELE SALES'}
        </h1>
        <p className="text-xs tracking-widest uppercase text-slate-500 font-medium">Nota Penjualan</p>
      </div>

      <div className="space-y-1.5 text-sm mb-6 pb-4 border-b border-slate-300 border-dashed">
        <div className="flex justify-between">
          <span className="text-slate-500">No. TRX</span>
          <span className="font-mono text-xs font-semibold">{transaction.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tanggal</span>
          <span className="font-medium">{format(new Date(transaction.date), 'dd MMM yyyy', { locale: idLocale })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Waktu</span>
          <span className="font-medium">{transaction.time} WIB</span>
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
          <span className="text-slate-500">Pelanggan</span>
          <span className="font-bold text-slate-900">{transaction.customerName}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-6 pb-4 border-b border-slate-300 border-dashed">
        <div className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wider">Rincian Timbangan (kg):</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {transaction.weights.map((w, i) => (
            <div key={i} className="flex justify-between text-slate-600">
              <span className="text-xs text-slate-400">T{i + 1}</span>
              <span className="font-mono">{w.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 text-sm mb-6 pb-4 border-b border-slate-300 border-dashed">
        <div className="flex justify-between font-medium">
          <span className="text-slate-600">Berat Kotor</span>
          <span className="font-mono">{transaction.grossWeight.toFixed(2)} kg</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tara ({transaction.taraPercentage}%)</span>
          <span className="font-mono text-slate-500">-{transaction.taraWeight.toFixed(2)} kg</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2">
          <span>Berat Bersih</span>
          <span className="font-mono">{transaction.netWeight.toFixed(2)} kg</span>
        </div>
        <div className="flex justify-between text-slate-600 mt-2">
          <span>Harga/kg</span>
          <span className="font-mono">Rp {transaction.pricePerKg.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="flex justify-between items-end text-xl font-black mb-6">
        <span className="text-slate-800 tracking-tight">TOTAL</span>
        <span className="font-mono">Rp {Math.floor(transaction.totalPrice).toLocaleString('id-ID')}</span>
      </div>

      {transaction.footnote && (
        <div className="mb-6 p-3 bg-slate-100/50 rounded text-xs text-slate-600 italic text-center">
          "{transaction.footnote}"
        </div>
      )}
      
      <div className="text-center mt-8 pt-4 text-xs text-slate-500 flex flex-col items-center gap-1">
        <span className="font-medium">Terima kasih atas kepercayaannya.</span>
        <span>Semoga berkah dan sukses selalu!</span>
      </div>
      
      {/* Jagged bottom edge effect */}
      <div className="absolute bottom-0 left-0 right-0 h-2" style={{
        background: 'linear-gradient(135deg, transparent 50%, #fdfaf6 50%) -10px 0, linear-gradient(-135deg, transparent 50%, #fdfaf6 50%) -10px 0',
        backgroundSize: '20px 10px',
        backgroundRepeat: 'repeat-x',
      }}></div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
export default Receipt;
