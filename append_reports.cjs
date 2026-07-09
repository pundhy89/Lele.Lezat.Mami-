const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const transactionRow = `

const ReportItemRow = ({ item, onEdit, onDelete, onClick }: { 
  item: ReportItem, 
  onEdit: (item: ReportItem) => void, 
  onDelete: (item: ReportItem) => void,
  onClick: (item: ReportItem) => void 
}) => {
  const controls = useAnimation();
  
  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;
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

  // Don't trigger onClick if dragging
  const handleTap = (e: any) => {
    onClick(item);
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
        onTap={handleTap}
        className="relative bg-[#FDFBF7] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#F4ECE4]/50 transition-colors z-10 w-full cursor-pointer"
      >
        <div className="flex-1 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[#4A4540]">{format(new Date(data.date), 'dd MMM yyyy')}</span>
            <span className="text-[#A39B91] text-xs">{data.time}</span>
            {isTx && (data as Transaction).isDebt && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold ml-2">Utang</span>
            )}
            {!isTx && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold ml-2">Pembayaran</span>
            )}
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
        <div className="font-semibold text-lg text-[#4A4540] pointer-events-none">
          Rp {isTx ? (data as Transaction).totalPrice.toLocaleString('id-ID') : (data as Payment).amount.toLocaleString('id-ID')}
        </div>
        <div className="hidden sm:block text-[#A39B91] pointer-events-none">
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>
    </div>
  );
};
`;

content = content.replace("export default function Reports() {", transactionRow + "\nexport default function Reports() {");
fs.writeFileSync('src/components/Reports.tsx', content);
