/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import TransactionForm from './components/TransactionForm';
import Reports from './components/Reports';
import Customers from './components/Customers';
import CustomerDetail from './components/CustomerDetail';
import DebtReport from './components/DebtReport';
import SettingsForm from './components/SettingsForm';
import { Calculator, LayoutDashboard, Users, Settings, CreditCard } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { AppSettings } from './types';
import { motion } from 'motion/react';

function TopBar() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
    
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'default'));
        if (snap.exists()) {
          setSettings(snap.data() as AppSettings);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const companyName = settings?.companyName || "Nama Perusahaan";

  return (
    <>
      {isIframe && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2 text-center relative z-50">
          <span className="font-medium">Mode Pratinjau:</span> Fitur cetak/unduh mungkin diblokir browser. Gunakan opsi tekan & tahan gambar, atau <strong>Buka di tab baru</strong>.
        </div>
      )}
      <header className="bg-[#F4ECE4]/50 backdrop-blur-md sticky top-0 z-40 pt-4 pb-2 px-4 border-b border-[#E5E0D8]/50">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="font-bold text-lg text-[#8B847C] tracking-tight flex items-center gap-2 bg-[#FDFBF7] px-4 py-2 rounded-2xl shadow-sm border border-[#E5E0D8]">
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          {companyName}
        </div>
      </div>
    </header>
    </>
  );
}

const NAV_ITEMS = [
  { to: "/", icon: Calculator, label: "Kasir" },
  { to: "/customers", icon: Users, label: "Pelanggan" },
  { to: "/debts", icon: CreditCard, label: "Piutang" },
  { to: "/reports", icon: LayoutDashboard, label: "Pendapatan" },
  { to: "/settings", icon: Settings, label: "Pengaturan" }
];

function BottomNavBar() {
  const location = useLocation();

  return (
    <div id="bottom-nav-bar" className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-6 pointer-events-none flex justify-center">
      <div className="bg-[#EBE2D9] border border-[#E3D9CE] px-2 py-2 rounded-[2rem] flex items-center justify-between gap-2 pointer-events-auto shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to || 
                           (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className="relative w-14 h-14 flex items-center justify-center z-10"
              title={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-bubble"
                  className="absolute inset-0 bg-[#3D3935] rounded-full border-[6px] border-[#F4ECE4]"
                  style={{ top: '-16px' }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              <item.icon 
                className={`w-6 h-6 transition-all duration-300 relative z-20 ${isActive ? 'text-[#EBE2D9] -translate-y-4' : 'text-[#A39B91] hover:text-[#4A4540]'}`} 
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F4ECE4] font-sans text-[#4A4540] pb-28">
        <TopBar />
        <main className="py-6">
          <Routes>
            <Route path="/" element={<TransactionForm />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/debts" element={<DebtReport />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SettingsForm />} />
          </Routes>
        </main>
        <BottomNavBar />
      </div>
    </BrowserRouter>
  );
}
