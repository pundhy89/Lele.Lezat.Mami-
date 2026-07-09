const fs = require('fs');
let content = fs.readFileSync('src/components/PrinterLayout.tsx', 'utf8');

const target = `export default function PrinterLayout({ 
  title, 
  children, 
  actionButton,
  printerWidth = "max-w-[380px]",
  receiptWidth = "max-w-[320px]"
}: PrinterLayoutProps) {
  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Printer Body Top */}
      <div className={\`w-full \${printerWidth} h-28 bg-[#EBE2D9] rounded-t-[2.5rem] rounded-b-[2rem] shadow-[0_15px_25px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.7)] relative z-20 flex flex-col justify-end items-center pb-4 border border-[#E3D9CE]\`}>
        {/* Printer Slot */}
        <div className="w-[88%] h-3.5 bg-[#232323] rounded-full shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] relative z-30 overflow-hidden">
           <div className="w-full h-full bg-gradient-to-b from-black/40 to-transparent"></div>
        </div>
      </div>`;

const replaceStr = `interface PrinterLayoutProps {
  title: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  printerWidth?: string;
  receiptWidth?: string;
  printerAddon?: React.ReactNode;
}

export default function PrinterLayout({ 
  title, 
  children, 
  actionButton,
  printerWidth = "max-w-[380px]",
  receiptWidth = "max-w-[320px]",
  printerAddon
}: PrinterLayoutProps) {
  return (
    <div className="w-full relative flex flex-col items-center">
      {/* Printer Body Top */}
      <div className={\`w-full \${printerWidth} h-28 bg-[#EBE2D9] rounded-t-[2.5rem] rounded-b-[2rem] shadow-[0_15px_25px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.7)] relative z-20 flex flex-col justify-end items-center pb-4 border border-[#E3D9CE]\`}>
        {printerAddon && (
          <div className="absolute top-4 right-6 z-40">
            {printerAddon}
          </div>
        )}
        
        {/* Printer Slot */}
        <div className="w-[88%] h-3.5 bg-[#232323] rounded-full shadow-[inset_0_3px_5px_rgba(0,0,0,0.8)] relative z-30 overflow-hidden">
           <div className="w-full h-full bg-gradient-to-b from-black/40 to-transparent"></div>
        </div>
      </div>`;

content = content.replace(/interface PrinterLayoutProps \{[\s\S]*?\}\n\nexport default function PrinterLayout\(\{[\s\S]*?\}\) \{[\s\S]*?\}\n      <\/div>/, replaceStr);

fs.writeFileSync('src/components/PrinterLayout.tsx', content);
