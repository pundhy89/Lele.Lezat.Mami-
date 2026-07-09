const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerDetail.tsx', 'utf8');

// 1. Revert Total Piutang text size
content = content.replace(
  "<span className=\"text-base font-bold text-slate-900\">Rp {(customer?.debtAmount || 0).toLocaleString('id-ID')}</span>",
  "<span className=\"text-xl font-black text-slate-900\">Rp {(customer?.debtAmount || 0).toLocaleString('id-ID')}</span>"
);

// 2. Remove Utang badge from table (if it exists)
content = content.replace(
  "{t.isDebt ? (\n                        <span className=\"px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-semibold\">Utang</span>\n                      ) : null}",
  ""
);

// 3. Remove Utang badge from PaymentRow
content = content.replace(
  "{p.type === 'debt' ? (\n              <span className=\"px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-semibold ml-2\">Utang</span>\n            ) : null}",
  ""
);

// 4. Revert nominal text size in PaymentRow
content = content.replace(
  "<div className={`font-semibold text-sm pointer-events-none ${p.type === 'debt' ? 'text-red-500' : 'text-emerald-500'}`}>",
  "<div className={`font-bold text-lg pointer-events-none ${p.type === 'debt' ? 'text-red-500' : 'text-emerald-500'}`}>"
);

fs.writeFileSync('src/components/CustomerDetail.tsx', content);
