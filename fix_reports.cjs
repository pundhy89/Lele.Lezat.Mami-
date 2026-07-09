const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

// 1. Revert nominal text size & remove Utang badge
content = content.replace(
  "{isTx && (data as Transaction).isDebt && (\n              <span className=\"px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold ml-2\">Utang</span>\n            )}",
  ""
);
content = content.replace(
  "{!isTx && (\n              <span className=\"px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-xs font-semibold ml-2\">Pembayaran</span>\n            )}",
  ""
);
content = content.replace(
  "<div className=\"font-semibold text-lg text-[#4A4540] pointer-events-none\">",
  "<div className=\"font-bold text-[#4A4540] pointer-events-none text-right\">"
);

fs.writeFileSync('src/components/Reports.tsx', content);
