import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppSettings } from '../types';
import { Settings2, Save, Store, Image as ImageIcon, Phone } from 'lucide-react';
import { compressImage } from '../lib/utils';
import PrinterLayout from './PrinterLayout';

export default function SettingsForm() {
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'LELE SALES',
    logoUrl: '',
    adminPhones: '+62'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const docRef = doc(db, 'settings', 'default');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        }
      } catch (error) {
        console.error("Error loading settings: ", error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'default'), settings);
      alert('Pengaturan berhasil disimpan!');
    } catch (error) {
      console.error("Error saving settings: ", error);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center text-[#A39B91]">Memuat pengaturan...</div>;

  return (
    <PrinterLayout 
      title="Pengaturan" 
      printerWidth="max-w-[800px]" 
      receiptWidth="max-w-[740px]"
    >
      <div className="bg-[#FDFBF7] rounded-2xl border border-dashed border-[#E5E0D8] p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-[#8B847C] mb-2 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#A39B91]" /> Nama Perusahaan
            </label>
            <input 
              type="text" 
              required
              value={settings.companyName}
              onChange={e => setSettings({...settings, companyName: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20 focus:border-[#8B847C] transition-all font-medium text-[#4A4540]"
              placeholder="Contoh: UD. SUMBER REJEKI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8B847C] mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#A39B91]" /> Nomor WhatsApp Admin
            </label>
            <input 
              type="text" 
              value={settings.adminPhones || ''}
              onChange={e => setSettings({...settings, adminPhones: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] bg-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#8B847C]/20 focus:border-[#8B847C] transition-all font-medium text-[#4A4540]"
              placeholder="Contoh: +628123456789, +628987654321 (Pisahkan dengan koma)"
            />
            <p className="mt-2 text-xs text-[#A39B91]">
              Digunakan untuk otomatis mengirim struk transaksi. Awali dengan kode negara (+62). Bisa lebih dari 1 nomor dipisah koma.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8B847C] mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#A39B91]" /> Logo Perusahaan (Opsional)
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const compressed = await compressImage(file, 400);
                    setSettings({...settings, logoUrl: compressed});
                  } catch (error) {
                    console.error("Failed to compress image", error);
                    alert("Gagal memproses gambar");
                  }
                }}
                className="block w-full text-sm text-[#8B847C]
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-[#EBE2D9] file:text-[#4A4540]
                  hover:file:bg-[#D4CEC5] transition-all cursor-pointer"
              />
            </div>
            <p className="mt-2 text-xs text-[#A39B91]">
              Pilih foto logo perusahaan dari perangkat Anda.
            </p>
          </div>

          {settings.logoUrl && (
            <div className="p-4 bg-[#F4ECE4] rounded-xl border border-[#E5E0D8] flex items-center gap-4">
              <div className="text-sm text-[#A39B91] font-medium">Preview Logo:</div>
              <img src={settings.logoUrl} alt="Logo Preview" className="h-12 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          )}

          <div className="pt-4 border-t border-[#E5E0D8]">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#3D3935] hover:bg-[#2A2724] disabled:bg-[#A39B91] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : (
                <>
                  <Save className="w-5 h-5" /> Simpan Pengaturan
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </PrinterLayout>
  );
}
