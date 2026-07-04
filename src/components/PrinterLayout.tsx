import React from 'react';

interface PrinterLayoutProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  printerWidth?: string;
  receiptWidth?: string;
}

export default function PrinterLayout({ 
  title, 
  children, 
  actionButton,
  printerWidth = "max-w-[380px]",
  receiptWidth = "max-w-[320px]"
}: PrinterLayoutProps) {
  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Printer Body Top */}
      <div className={`w-full ${printerWidth} h-28 bg-[#EBE2D9] rounded-t-[2.5rem] rounded-b-[2rem] shadow-[0_15px_25px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.7)] relative z-20 flex flex-col justify-end items-center pb-4 border border-[#E3D9CE]`}>
        {/* Printer Slot */}
        <div className="w-[88%] h-3.5 bg-[#232323] rounded-full shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] relative z-30 overflow-hidden">
           <div className="w-full h-full bg-gradient-to-b from-black/40 to-transparent"></div>
        </div>
      </div>
      
      {/* Receipt Paper */}
      <div className={`w-[92%] ${receiptWidth} bg-[#FDFBF7] -mt-6 relative z-10 pt-10 pb-10 px-4 sm:px-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex flex-col min-h-[500px] receipt-paper`}
           style={{
             background: 'linear-gradient(to bottom, #FDFBF7, #FDFBF7) padding-box, url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'6\' viewBox=\'0 0 12 6\' fill=\'%23FDFBF7\'%3E%3Cpath d=\'M0 0l6 6 6-6z\'/%3E%3C/svg%3E") repeat-x left bottom / 12px 6px',
             paddingBottom: '1.5rem',
             borderBottom: '6px solid transparent',
             borderBottomLeftRadius: '0px',
             borderBottomRightRadius: '0px'
           }}>
        
        <div className="border-b-2 border-dashed border-[#E5E0D8] py-3 mb-6 text-center">
          <h1 className="font-mono text-sm tracking-widest text-[#A39B91] uppercase">{title}</h1>
        </div>

        <div className="flex-1 flex flex-col space-y-5">
          {children}
        </div>
      </div>

      {/* Action Button (Outside Receipt) */}
      {actionButton && (
        <div className={`w-[92%] ${receiptWidth} mt-8 flex flex-col gap-4`}>
          {actionButton}
        </div>
      )}
    </div>
  );
}
