import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAnENBkg50gGs_cOH4jQ5CMLsxLHVWRm64",
  authDomain: "hamara-hisaab.firebaseapp.com",
  databaseURL: "https://hamara-hisaab-default-rtdb.firebaseio.com",
  projectId: "hamara-hisaab",
  storageBucket: "hamara-hisaab.firebasestorage.app",
  messagingSenderId: "1009773743957",
  appId: "1:1009773743957:web:81337dbbc1c2f7b93ae9dc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
