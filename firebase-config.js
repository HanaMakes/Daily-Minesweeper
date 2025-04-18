// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_aWsSAMPq1AG5hf1IZHJ5-CKPPLup_9E",
  authDomain: "daily-minesweeper.firebaseapp.com",
  projectId: "daily-minesweeper",
  storageBucket: "daily-minesweeper.firebasestorage.app",
  messagingSenderId: "467023329842",
  appId: "1:467023329842:web:7d5ab56a4e0121da54da2b",
  measurementId: "G-1R1XKZJV2J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);