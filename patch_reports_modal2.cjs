const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

// Replace setSelectedTx and handleItemClick
content = content.replace(
  "const handleItemClick = (item: ReportItem) => {\n    if (item.type === 'transaction') {\n      setSelectedTx(item.data);\n    }\n  };",
  "const handleItemClick = (item: ReportItem) => {\n    setSelectedItem(item);\n  };"
);

// Replace selectedTx usages with selectedItem
content = content.replace("{selectedTx && (", "{selectedItem && (");
content = content.replace("transaction={selectedTx}", "transaction={selectedItem.data as any}");
content = content.replace("data: selectedTx", "data: selectedItem.data as any");
content = content.replace("data: selectedTx", "data: selectedItem.data as any");

// Update the hidden receipt logic
const hiddenReceiptOld = `{/* HIDDEN ACTUAL RECEIPT COMPONENT FOR HTML-TO-IMAGE */}
              <div className="absolute top-[-9999px] left-[-9999px]">
                <Receipt ref={receiptRef} transaction={selectedItem.data as any} settings={settings} />
              </div>`;

const hiddenReceiptNew = `{/* HIDDEN ACTUAL RECEIPT COMPONENT FOR HTML-TO-IMAGE */}
              <div className="absolute top-[-9999px] left-[-9999px]">
                {selectedItem.type === 'transaction' ? (
                  <Receipt ref={receiptRef} transaction={selectedItem.data as any} settings={settings} />
                ) : (
                  <PaymentReceipt 
                    ref={receiptRef} 
                    payment={selectedItem.data as any} 
                    settings={settings} 
                    customer={customers.find((c: any) => c.id === (selectedItem.data as any).customerId)} 
                  />
                )}
              </div>`;

content = content.replace(hiddenReceiptOld, hiddenReceiptNew);

// Fix imports
if (!content.includes('PaymentReceipt')) {
  content = content.replace("import Receipt from './Receipt';", "import Receipt from './Receipt';\nimport PaymentReceipt from './PaymentReceipt';");
}

// Ensure setGenerating and other things still work
// Need to add setJpegDataUrl(null) when opening a new item, otherwise it shows old receipt.
content = content.replace(
  "const handleItemClick = (item: ReportItem) => {\n    setSelectedItem(item);\n  };",
  "const handleItemClick = (item: ReportItem) => {\n    setJpegDataUrl(null);\n    setSelectedItem(item);\n  };"
);

// Also update useEffect for auto-generating the JPEG
content = content.replace(
  "useEffect(() => {\n    if (selectedItem && receiptRef.current) {\n      generateJpeg();\n    }\n  }, [selectedItem]);",
  ""
); // wait, where was the generation logic? Let's check!

fs.writeFileSync('src/components/Reports.tsx', content);
