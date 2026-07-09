const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const target = `{undoState.item && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">Laporan dihapus</span>
          <button 
            onClick={handleUndo}
            className="text-emerald-400 font-bold text-sm hover:text-emerald-300"
          >
            BATAL
          </button>
        </div>
      )}`;

content = content.replace(target, "");

const printerTarget = `<PrinterLayout 
      title="Pendapatan Harian"`;

const printerReplace = `<PrinterLayout 
      title="Pendapatan Harian"
      printerAddon={
        undoState.item ? (
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full shadow-[0_2px_10px_rgba(239,68,68,0.4)] transition-all active:scale-95 border-2 border-[#EBE2D9]"
            title="Batalkan Hapus Laporan"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            <span className="text-[10px] font-bold tracking-wider">UNDO</span>
          </button>
        ) : null
      }`;

content = content.replace(printerTarget, printerReplace);

fs.writeFileSync('src/components/Reports.tsx', content);
