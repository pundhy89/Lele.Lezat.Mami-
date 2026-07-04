import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';
import { Users, Plus, Trash2, Edit2, Save, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PrinterLayout from './PrinterLayout';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+62');
  const [defaultTara, setDefaultTara] = useState<number>(3);
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers: ", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    
    try {
      const customerData = {
        name: name.trim(),
        phone: phone.trim(),
        defaultTara,
        defaultPrice,
        createdAt: Date.now()
      };

      if (editingId) {
        await updateDoc(doc(db, 'customers', editingId), customerData);
      } else {
        await addDoc(collection(db, 'customers'), { ...customerData, debtAmount: 0 });
      }
      
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer: ", error);
      alert('Gagal menyimpan data pelanggan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pelanggan ini?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      setCustomers(customers.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting: ", error);
      alert('Gagal menghapus pelanggan');
    }
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id!);
    setName(c.name);
    setPhone(c.phone || '+62');
    setDefaultTara(c.defaultTara);
    setDefaultPrice(c.defaultPrice);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPhone('+62');
    setDefaultTara(3);
    setDefaultPrice(0);
  };

  return (
    <PrinterLayout 
      title="Buku Pelanggan" 
      printerWidth="max-w-[1000px]" 
      receiptWidth="max-w-[940px]"
    >
      <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] p-6 mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <div className="flex-1 w-full min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pelanggan</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Masukkan nama"
            />
          </div>
          <div className="flex-1 w-full min-w-[150px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
            <input 
              type="text" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="+62..."
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Tara (%)</label>
            <input 
              type="number" 
              step="0.1"
              required
              value={defaultTara}
              onChange={e => setDefaultTara(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga Default (Rp)</label>
            <input 
              type="number" 
              required
              value={defaultPrice || ''}
              onChange={e => setDefaultPrice(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="0"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              type="submit" 
              disabled={isSubmitting || !name}
              className="flex-1 md:flex-none bg-[#3D3935] hover:bg-[#2A2724] disabled:bg-[#A39B91] text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {editingId ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
              {editingId ? 'Simpan' : 'Tambah'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#A39B91]">Memuat data...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-[#E5E0D8] mx-auto mb-3" />
            <p className="text-[#A39B91] font-medium">Belum ada pelanggan tersimpan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#8B847C]">
              <thead className="bg-[#F4ECE4] text-[#4A4540] font-semibold border-b border-[#E5E0D8]">
                <tr>
                  <th className="px-6 py-4">Nama Pelanggan</th>
                  <th className="px-6 py-4">Tara Default</th>
                  <th className="px-6 py-4">Harga Default</th>
                  <th className="px-6 py-4">Total Utang</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-[#F4ECE4]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#4A4540]">{c.name}</td>
                    <td className="px-6 py-4">{c.defaultTara}%</td>
                    <td className="px-6 py-4">Rp {c.defaultPrice.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-semibold text-red-600">
                      {c.debtAmount ? `Rp ${c.debtAmount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/customers/${c.id}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Detail Pelanggan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id!)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
