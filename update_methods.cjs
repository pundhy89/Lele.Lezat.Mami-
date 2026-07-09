const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const newMethods = `
  const handleEditItem = (item: ReportItem) => {
    if (item.type === 'transaction') {
      navigate('/', { state: { editTx: item.data } });
    } else {
      alert('Pengeditan pembayaran piutang dapat dilakukan di menu Pelanggan.');
    }
  };

  const handleDeleteItem = async (item: ReportItem) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      try {
        if (item.type === 'transaction') {
          await deleteDoc(doc(db, 'transactions', item.data.id!));
          if (item.data.isDebt && item.data.customerId) {
            await updateDoc(doc(db, 'customers', item.data.customerId), {
              debtAmount: increment(-item.data.totalPrice)
            });
          }
        } else {
          await deleteDoc(doc(db, 'payments', item.data.id!));
          await updateDoc(doc(db, 'customers', item.data.customerId), {
            debtAmount: increment(item.data.amount)
          });
        }
        setItems(prev => prev.filter(i => i.data.id !== item.data.id));
      } catch (err) {
        alert('Gagal menghapus data');
      }
    }
  };

  const handleItemClick = (item: ReportItem) => {
    if (item.type === 'transaction') {
      setSelectedTx(item.data);
    }
  };

  const totalToday = items
    .filter(i => isToday(new Date(i.data.date)))
    .reduce((sum, i) => {
      if (i.type === 'transaction') {
        if (i.data.isDebt) return sum;
        return sum + i.data.totalPrice;
      } else {
        return sum + i.data.amount;
      }
    }, 0);
`;

const oldTotalToday = `  const totalToday = transactions
    .filter(t => isToday(new Date(t.date)))
    .reduce((sum, t) => sum + t.totalPrice, 0);`;

content = content.replace(oldTotalToday, newMethods);

const oldTable = `<div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#8B847C]">
              <thead className="bg-[#F4ECE4] text-[#4A4540] font-semibold border-b border-[#E5E0D8]">
                <tr>
                  <th className="px-6 py-4">Tanggal & Waktu</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4 text-right">Berat Bersih</th>
                  <th className="px-6 py-4 text-right">Harga/kg</th>
                  <th className="px-6 py-4 text-right">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {transactions.map(trx => (
                  <tr 
                    key={trx.id} 
                    onClick={() => setSelectedTx(trx)}
                    className="hover:bg-[#F4ECE4]/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#A39B91]" />
                        <div>
                          <div className="font-medium text-[#4A4540]">
                            {format(new Date(trx.date), 'dd MMM yyyy', { locale: idLocale })}
                          </div>
                          <div className="text-xs text-[#A39B91]">{trx.time} WIB</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#4A4540]">
                      {trx.customerName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {trx.netWeight.toFixed(2)} kg
                      <div className="text-xs text-[#A39B91]">Tara {trx.taraPercentage}%</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      Rp {trx.pricePerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#4A4540]">
                      Rp {Math.floor(trx.totalPrice).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>`;

const newTable = `<div className="flex flex-col">
            <div className="p-2 text-center text-xs text-[#8B847C] bg-amber-50 border-b border-amber-100">
              <span className="hidden sm:inline">Geser baris ke <strong>kiri</strong> untuk hapus, geser ke <strong>kanan</strong> untuk edit.</span>
              <span className="sm:hidden">Geser baris ke <strong>kiri</strong> (hapus), ke <strong>kanan</strong> (edit).</span>
            </div>
            {items.map(item => (
              <ReportItemRow
                key={item.data.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onClick={handleItemClick}
              />
            ))}
          </div>`;

// Since transactions.length === 0 check is there, change it to items.length === 0
content = content.replace("transactions.length === 0 ?", "items.length === 0 ?");
content = content.replace(oldTable, newTable);

fs.writeFileSync('src/components/Reports.tsx', content);
