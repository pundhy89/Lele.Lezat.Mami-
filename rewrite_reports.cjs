const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

content = content.replace(
  "import { ReceiptText, Calendar, X, Share2, Download, Printer } from 'lucide-react';",
  "import { ReceiptText, Calendar, X, Share2, Download, Printer, Edit2, Trash2, ArrowRight } from 'lucide-react';\nimport { motion, useAnimation, PanInfo } from 'motion/react';\nimport { useNavigate } from 'react-router-dom';"
);

content = content.replace(
  "import { Transaction, AppSettings } from '../types';",
  "import { Transaction, AppSettings, Payment } from '../types';\n\ntype ReportItem = { type: 'transaction', data: Transaction } | { type: 'payment', data: Payment };"
);

content = content.replace(
  "import { collection, query, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';",
  "import { collection, query, orderBy, getDocs, limit, doc, getDoc, where, deleteDoc, updateDoc, increment } from 'firebase/firestore';"
);

content = content.replace(
  "const [transactions, setTransactions] = useState<Transaction[]>([]);",
  "const [items, setItems] = useState<ReportItem[]>([]);\n  const navigate = useNavigate();"
);

const loadDataOld = `        const [settingsSnap, txSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'default')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50)))
        ]);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }

        const data = txSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(data);`;
const loadDataNew = `        const [settingsSnap, txSnap, paySnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'default')),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50))),
          getDocs(query(collection(db, 'payments'), where('type', '==', 'payment'), orderBy('createdAt', 'desc'), limit(50)))
        ]);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }

        const txData = txSnap.docs.map(doc => ({
          type: 'transaction' as const,
          data: { id: doc.id, ...doc.data() } as Transaction
        }));
        
        const payData = paySnap.docs.map(doc => ({
          type: 'payment' as const,
          data: { id: doc.id, ...doc.data() } as Payment
        }));
        
        const combined = [...txData, ...payData].sort((a, b) => b.data.createdAt - a.data.createdAt).slice(0, 50);
        setItems(combined);`;

content = content.replace(loadDataOld, loadDataNew);

fs.writeFileSync('src/components/Reports.tsx', content);
