const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerDetail.tsx', 'utf8');

content = content.replace("const threshold = 80;", "const threshold = 30; // Very responsive");
fs.writeFileSync('src/components/CustomerDetail.tsx', content);
