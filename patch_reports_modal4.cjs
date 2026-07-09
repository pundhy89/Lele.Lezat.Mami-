const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

content = content.replace(
  "handleEditItem({ type: 'transaction', data: selectedItem.data as any });",
  "handleEditItem(selectedItem!);"
);
content = content.replace(
  "handleDeleteItem({ type: 'transaction', data: selectedItem.data as any });",
  "handleDeleteItem(selectedItem!);"
);

// Wait, the edit button only exists once? Let me just regex replace all of them.
content = content.replace(/handleEditItem\(\{ type: 'transaction', data: selectedItem\.data as any \}\);/g, "handleEditItem(selectedItem!);");
content = content.replace(/handleDeleteItem\(\{ type: 'transaction', data: selectedItem\.data as any \}\);/g, "handleDeleteItem(selectedItem!);");

fs.writeFileSync('src/components/Reports.tsx', content);
