import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpBm3_cwG9eagILU_QLyOmgTkUrerlUTM",
  authDomain: "villain-company.firebaseapp.com",
  projectId: "villain-company",
  storageBucket: "villain-company.firebasestorage.app",
  messagingSenderId: "839175677237",
  appId: "1:839175677237:web:39fa841b0fbe7184b2587c",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
