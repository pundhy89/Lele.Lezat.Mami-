const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const regex = /<motion\.div\s*drag="x"\s*dragConstraints={{ left: 0, right: 0 }}\s*dragElastic={0\.2}\s*onDragEnd={handleDragEnd}\s*animate={controls}\s*onClick={handleClick}\s*onDragStart={handleDragStart}\s*onDrag={handleDrag}\s*className="relative bg-\[#FDFBF7\] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-\[#F4ECE4\]\/50 transition-colors z-10 w-full cursor-pointer"\s*>\s*<div className="flex-1 pointer-events-none">\s*<div className="flex items-center gap-2 mb-1">\s*<span className="font-medium text-\[#4A4540\]">{format\(new Date\(data\.date\), 'dd MMM yyyy'\)}<\/span>\s*<span className="text-\[#A39B91\] text-xs">{data\.time}<\/span>[\s\S]*?<\/motion\.div>/;

const replaceStr = `<motion.div
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
      </motion.div>`;

content = content.replace(regex, replaceStr);
fs.writeFileSync('src/components/Reports.tsx', content);
