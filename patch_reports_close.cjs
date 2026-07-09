const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const target = `<div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    closeModal();
                    handleEditItem({ type: 'transaction', data: selectedTx });
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Nota
                </button>
                <button
                  onClick={() => {
                    closeModal();
                    handleDeleteItem({ type: 'transaction', data: selectedTx });
                  }}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Batalkan Nota
                </button>
              </div>`;

const replaceStr = `<div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    closeModal();
                    handleEditItem({ type: 'transaction', data: selectedTx });
                  }}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-600 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Nota
                </button>
                <button
                  onClick={closeModal}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Tutup Nota
                </button>
              </div>`;

content = content.replace(target, replaceStr);
fs.writeFileSync('src/components/Reports.tsx', content);
