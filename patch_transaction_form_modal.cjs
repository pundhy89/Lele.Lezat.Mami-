const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionForm.tsx', 'utf8');

const replaceStr = `                <>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => {
                        // Allow user to edit the just saved transaction by resetting savedTx
                        // but not clearing the form fields.
                        setSavedTx(null);
                      }}
                      className="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      Batal / Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("Batalkan transaksi ini?")) {
                           try {
                             await deleteDoc(doc(db, 'transactions', savedTx.id));
                             if (savedTx.isDebt && savedTx.customerId) {
                               await updateDoc(doc(db, 'customers', savedTx.customerId), {
                                 debtAmount: increment(-savedTx.totalPrice)
                               });
                             }
                             setSavedTx(null);
                             // reset form
                             setWeights(['']);
                             setCustomerName('');
                             setCustomerId('');
                             setPricePerKg(0);
                           } catch(e) {
                             alert("Gagal membatalkan transaksi");
                           }
                        }
                      }}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={handleShareApp}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Share2 className="w-4 h-4" /> Bagikan File
                    </button>
                    <button
                      onClick={downloadImage}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> Unduh
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Struk
                  </button>
                </>`;

const target = `<>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={handleShareApp}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Share2 className="w-4 h-4" /> Bagikan File
                    </button>
                    <button
                      onClick={downloadImage}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" /> Unduh
                    </button>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2 text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Struk
                  </button>
                </>`;

content = content.replace(target, replaceStr);

// add deleteDoc import if needed
if (!content.includes('deleteDoc')) {
  content = content.replace(
    "updateDoc, increment, getDoc } from 'firebase/firestore';",
    "updateDoc, increment, getDoc, deleteDoc } from 'firebase/firestore';"
  );
}

fs.writeFileSync('src/components/TransactionForm.tsx', content);
