import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Payment, AppSettings, Customer } from '../types';

interface PaymentReceiptProps {
  payment: Payment;
  settings: AppSettings | null;
  customer?: Customer;
}

const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(({ payment, settings, customer }, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-[#fdfaf6] w-[400px] p-8 text-slate-800 font-sans shadow-sm relative overflow-hidden"
      style={{
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
        <p className="text-xs tracking-widest uppercase text-slate-500 font-medium">Nota Mutasi Piutang</p>
      </div>

      <div className="space-y-1.5 text-sm mb-6 pb-4 border-b border-slate-300 border-dashed">
        <div className="flex justify-between">
          <span className="text-slate-500">ID Mutasi</span>
          <span className="font-mono text-xs font-semibold">{payment.id?.slice(0, 8).toUpperCase() || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tanggal</span>
          <span className="font-medium">{format(new Date(payment.date), 'dd MMM yyyy', { locale: idLocale })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Waktu</span>
          <span className="font-medium">{payment.time} WIB</span>
        </div>
        {customer && (
          <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
            <span className="text-slate-500">Pelanggan</span>
            <span className="font-bold text-slate-900">{customer.name}</span>
          </div>
        )}
      </div>

      <div className="space-y-2.5 text-sm mb-6 pb-4 border-b border-slate-300 border-dashed">
        <div className="flex justify-between font-medium">
          <span className="text-slate-600">Tipe Mutasi</span>
          <span className={`font-bold ${payment.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}`}>
            {payment.type === 'debt' ? 'Penambahan Utang' : 'Pembayaran Piutang'}
          </span>
        </div>
        {payment.notes && (
          <div className="flex justify-between text-slate-600 mt-2">
            <span>Keterangan</span>
            <span className="text-right max-w-[200px] break-words">{payment.notes}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end text-xl font-black mb-6">
        <span className="text-slate-800 tracking-tight">TOTAL</span>
        <span className="font-mono">Rp {Math.floor(payment.amount).toLocaleString('id-ID')}</span>
      </div>

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

PaymentReceipt.displayName = 'PaymentReceipt';
export default PaymentReceipt;
