const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionForm.tsx', 'utf8');

const replaceStr = `                  <button
                    onClick={async () => {
                      if (window.confirm("Batalkan transaksi ini? (Data akan dihapus)")) {
                         try {
                           await deleteDoc(doc(db, 'transactions', savedTx.id));
                           if (savedTx.isDebt && savedTx.customerId) {
                             await updateDoc(doc(db, 'customers', savedTx.customerId), {
                               debtAmount: increment(-savedTx.totalPrice)
                             });
                           }
                           setSavedTx(null);
                         } catch(e) {
                           alert("Gagal membatalkan transaksi");
                         }
                      }
                    }}
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4 text-sm border border-red-100"
                  >
                    Batal (Tidak Jadi)
                  </button>
                  <button
                    onClick={handlePrint}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Struk
                  </button>`;

const target = `<button
                    onClick={handlePrint}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Struk
                  </button>`;

content = content.replace(target, replaceStr);

// add deleteDoc import if missing
if (!content.includes('deleteDoc')) {
  content = content.replace(
    "updateDoc, increment, getDoc } from 'firebase/firestore';",
    "updateDoc, increment, getDoc, deleteDoc } from 'firebase/firestore';"
  );
}

fs.writeFileSync('src/components/TransactionForm.tsx', content);
