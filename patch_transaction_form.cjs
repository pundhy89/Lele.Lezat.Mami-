const fs = require('fs');
let content = fs.readFileSync('src/components/TransactionForm.tsx', 'utf8');

// Update saveTransaction
const saveTransactionRegex = /const newTxRef = await addDoc\(collection\(db, 'transactions'\), transactionData\);/g;

if (content.match(saveTransactionRegex)) {
  const replaceStr = `      let newTxId;
      if (editTx && editTx.id) {
        await updateDoc(doc(db, 'transactions', editTx.id), transactionData);
        newTxId = editTx.id;
        
        // Revert old debt if it was debt
        if (editTx.isDebt && editTx.customerId) {
          await updateDoc(doc(db, 'customers', editTx.customerId), {
            debtAmount: increment(-editTx.totalPrice)
          });
        }
      } else {
        const newTxRef = await addDoc(collection(db, 'transactions'), transactionData);
        newTxId = newTxRef.id;
      }`;
  content = content.replace(saveTransactionRegex, replaceStr);
  
  content = content.replace(
    "return { id: newTxRef.id, ...transactionData };",
    "return { id: newTxId, ...transactionData };"
  );
  
  fs.writeFileSync('src/components/TransactionForm.tsx', content);
  console.log("Updated TransactionForm.tsx");
} else {
  console.log("Could not find regex match");
}
