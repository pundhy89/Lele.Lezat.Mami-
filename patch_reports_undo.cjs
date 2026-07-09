const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');

const undoStateDecl = `  const [items, setItems] = useState<ReportItem[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [undoState, setUndoState] = useState<{ item: ReportItem | null, timeoutId: NodeJS.Timeout | null }>({ item: null, timeoutId: null });
`;

content = content.replace("  const [items, setItems] = useState<ReportItem[]>([]);\n  const navigate = useNavigate();\n  const [loading, setLoading] = useState(true);\n  const [settings, setSettings] = useState<AppSettings | null>(null);", undoStateDecl);

const handleDeleteItemNew = `  const commitDelete = async (item: ReportItem) => {
    try {
      if (item.type === 'transaction') {
        await deleteDoc(doc(db, 'transactions', item.data.id!));
        if (item.data.isDebt && item.data.customerId) {
          await updateDoc(doc(db, 'customers', item.data.customerId), {
            debtAmount: increment(-item.data.totalPrice)
          });
        }
      } else {
        await deleteDoc(doc(db, 'payments', item.data.id!));
        await updateDoc(doc(db, 'customers', item.data.customerId), {
          debtAmount: increment(item.data.amount)
        });
      }
    } catch (err) {
      console.error('Gagal menghapus data', err);
    }
  };

  const handleDeleteItem = (item: ReportItem) => {
    setItems(prev => prev.filter(i => i.data.id !== item.data.id));
    if (undoState.timeoutId) {
      clearTimeout(undoState.timeoutId);
      if (undoState.item) commitDelete(undoState.item);
    }
    const tId = setTimeout(() => {
      commitDelete(item);
      setUndoState({ item: null, timeoutId: null });
    }, 5000);
    setUndoState({ item, timeoutId: tId });
  };

  const handleUndo = () => {
    if (undoState.timeoutId) clearTimeout(undoState.timeoutId);
    if (undoState.item) {
      setItems(prev => {
        const newItems = [...prev, undoState.item!];
        newItems.sort((a, b) => b.data.createdAt - a.data.createdAt);
        return newItems;
      });
    }
    setUndoState({ item: null, timeoutId: null });
  };
`;

const handleDeleteItemOldRegex = /const handleDeleteItem = async \(item: ReportItem\) => {[\s\S]*?};\n/m;
content = content.replace(handleDeleteItemOldRegex, handleDeleteItemNew);

const toastUI = `{undoState.item && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-4 z-50">
          <span className="text-sm font-medium">Laporan dihapus</span>
          <button 
            onClick={handleUndo}
            className="text-emerald-400 font-bold text-sm hover:text-emerald-300"
          >
            BATAL
          </button>
        </div>
      )}`;

content = content.replace("{/* MODAL STRUK */}", toastUI + "\n\n      {/* MODAL STRUK */}");

fs.writeFileSync('src/components/Reports.tsx', content);
