import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "yachty-analyzer-4k6kr",
  appId: "1:545533725296:web:5a124d7111bddf50fb82b5",
  apiKey: "AIzaSyAm4zxTNozo8ewIlJWz0DtXptPj_LvqHz0",
  authDomain: "yachty-analyzer-4k6kr.firebaseapp.com",
  storageBucket: "yachty-analyzer-4k6kr.firebasestorage.app",
  messagingSenderId: "545533725296",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-de731401-cb07-4252-93c5-15ae0c193f91");
export const storage = getStorage(app);
