const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const target = `const [settingsSnap, txSnap, paySnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'default')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'payments'), where('type', '==', 'payment'), orderBy('createdAt', 'desc'), limit(50)))
        ]);`;

const replaceStr = `const [settingsSnap, txSnap, paySnap, custSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'default')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'payments'), where('type', '==', 'payment'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(collection(db, 'customers'))
        ]);
        
        const custData = custSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomers(custData);`;

content = content.replace(target, replaceStr);
fs.writeFileSync('src/components/Reports.tsx', content);
