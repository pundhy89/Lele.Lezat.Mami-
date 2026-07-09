const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerDetail.tsx', 'utf8');

const regex = /<motion\.div\s*drag="x"\s*dragConstraints={{ left: 0, right: 0 }}\s*dragElastic={0\.2}\s*onDragEnd={handleDragEnd}\s*animate={controls}\s*className="relative bg-\[#FDFBF7\] p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-\[#F4ECE4\]\/50 transition-colors z-10 w-full"\s*>\s*<div className="flex-1 pointer-events-none">\s*<div className="flex items-center gap-2 mb-1">\s*<span className="font-medium text-\[#4A4540\]">{format\(new Date\(p\.date\), 'dd MMM yyyy'\)}<\/span>\s*<span className="text-\[#A39B91\] text-xs">{p\.time}<\/span>\s*<\/div>\s*\{p\.notes && <div className="text-sm text-\[#8B847C\]">\{p\.notes\}<\/div>\}\s*<\/div>\s*<div className={`font-semibold text-sm pointer-events-none \$\{p\.type === 'debt' \? 'text-red-600' : 'text-emerald-600'\}`}>\s*\{p\.type === 'debt' \? '\+' : '-'} Rp \{p\.amount\.toLocaleString\('id-ID'\)\}\s*<\/div>\s*\{p\.photoUrl && \(\s*<a href=\{p\.photoUrl\} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-sm bg-blue-50 px-3 py-1\.5 rounded-lg shrink-0" onPointerDown=\{\(e\) => e\.stopPropagation\(\)\}>\s*<Camera className="w-4 h-4" \/> Bukti\s*<\/a>\s*\)\}\s*<\/motion\.div>/;

const replaceStr = `<motion.div
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
            <div className={\`font-bold text-sm pointer-events-none \${p.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}\`}>
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
      </motion.div>`;

content = content.replace(regex, replaceStr);
fs.writeFileSync('src/components/CustomerDetail.tsx', content);
