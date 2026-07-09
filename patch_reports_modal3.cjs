const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

content = content.replace(
  "useEffect(() => {\n    if (selectedTx && receiptRef.current) {\n      generateJpeg();\n    }\n  }, [selectedTx]);",
  "useEffect(() => {\n    if (selectedItem && receiptRef.current) {\n      generateJpeg();\n    }\n  }, [selectedItem]);"
);

content = content.replace("const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);", "const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null);\n  const [customers, setCustomers] = useState<any[]>([]);");

content = content.replace(
  "const closeModal = () => {\n    setSelectedTx(null);\n    setJpegDataUrl(null);\n  };",
  "const closeModal = () => {\n    setSelectedItem(null);\n    setJpegDataUrl(null);\n  };"
);

content = content.replace(
  "<h3 className=\"font-semibold text-slate-800\">Nota Transaksi</h3>",
  "<h3 className=\"font-semibold text-slate-800\">{selectedItem?.type === 'transaction' ? 'Nota Transaksi' : 'Nota Mutasi'}</h3>"
);

fs.writeFileSync('src/components/Reports.tsx', content);
