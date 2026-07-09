const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const target = `<div className="relative bg-[#FDFBF7] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#F4ECE4]/50 transition-colors z-10 w-full cursor-pointer"
      >
        <div className="flex-1 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[#4A4540]">{format(new Date(data.date), 'dd MMM yyyy')}</span>
            <span className="text-[#A39B91] text-xs">{data.time}</span>
            
            
          </div>
          <div className="text-sm text-[#4A4540]">
            {isTx ? (data as Transaction).customerName : (data as Payment).notes || 'Pembayaran Piutang'}
          </div>
          {isTx && (
             <div className="text-xs text-[#8B847C] mt-1 flex gap-3">
               <span>Net: {(data as Transaction).netWeight.toFixed(2)}kg</span>
               <span>@Rp {(data as Transaction).pricePerKg.toLocaleString('id-ID')}</span>
             </div>
          )}
        </div>
        <div className="font-bold text-[#4A4540] pointer-events-none text-right">
          Rp {isTx ? (data as Transaction).totalPrice.toLocaleString('id-ID') : (data as Payment).amount.toLocaleString('id-ID')}
        </div>
        <div className="hidden sm:block text-[#A39B91] pointer-events-none">
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>`;

const replaceStr = `<div className="relative bg-[#FDFBF7] px-4 py-3 hover:bg-[#F4ECE4]/50 transition-colors z-10 w-full cursor-pointer"
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
          <div className="text-sm text-[#4A4540]">
            {isTx ? (data as Transaction).customerName : (data as Payment).notes || 'Pembayaran Piutang'}
          </div>
          {isTx && (
             <div className="text-xs text-[#8B847C] flex gap-3 mt-0.5">
               <span>Net: {(data as Transaction).netWeight.toFixed(2)}kg</span>
               <span>@Rp {(data as Transaction).pricePerKg.toLocaleString('id-ID')}</span>
             </div>
          )}
        </div>
      </motion.div>`;

content = content.replace(target, replaceStr);
fs.writeFileSync('src/components/Reports.tsx', content);
