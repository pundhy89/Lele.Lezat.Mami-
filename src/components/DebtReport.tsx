import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';
import { CreditCard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PrinterLayout from './PrinterLayout';

export default function DebtReport() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDebts() {
      setLoading(true);
      try {
        const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        
        // Filter only customers with debt
        const debtors = data.filter(c => (c.debtAmount || 0) > 0);
        setCustomers(debtors);
      } catch (error) {
        console.error("Error fetching debts: ", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDebts();
  }, []);

  const totalDebt = customers.reduce((sum, c) => sum + (c.debtAmount || 0), 0);

  return (
    <PrinterLayout 
      title="Laporan Piutang" 
      printerWidth="max-w-[800px]" 
      receiptWidth="max-w-[740px]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#F4ECE4] rounded-2xl border border-[#E5E0D8] p-4 text-center">
          <div className="text-sm font-medium text-[#8B847C] mb-1">Total Piutang Berjalan</div>
          <div className="text-xl font-bold text-red-600">
            Rp {totalDebt.toLocaleString('id-ID')}
          </div>
        </div>
        <div className="bg-[#F4ECE4] rounded-2xl border border-[#E5E0D8] p-4 text-center">
          <div className="text-sm font-medium text-[#8B847C] mb-1">Jumlah Pelanggan</div>
          <div className="text-2xl font-black text-[#4A4540]">
            {customers.length} <span className="text-base font-normal text-[#8B847C]">Orang</span>
          </div>
        </div>
      </div>

      <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#A39B91]">Memuat data piutang...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-[#E5E0D8] mx-auto mb-3" />
            <p className="text-[#A39B91] font-medium">Tidak ada pelanggan yang memiliki utang saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#8B847C]">
              <thead className="bg-[#F4ECE4] text-[#4A4540] font-semibold border-b border-[#E5E0D8]">
                <tr>
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4 text-right">Total Utang</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#F4ECE4]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#4A4540]">{c.name}</td>
                    <td className="px-6 py-4 text-right font-semibold text-red-600">
                      Rp {c.debtAmount?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <Link 
                          to={`/customers/${c.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBE2D9] text-[#4A4540] hover:bg-[#D4CEC5] rounded-lg transition-colors text-xs font-medium border border-[#E3D9CE]"
                        >
                          Lihat Detail <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PrinterLayout>
  );
}
