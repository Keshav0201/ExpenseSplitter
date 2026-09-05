import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbsRpYUOVxkbKR7RtkF8ATTvIkRdL4zKA",
  authDomain: "expensesplitter-56382.firebaseapp.com",
  projectId: "expensesplitter-56382",
  storageBucket: "expensesplitter-56382.firebasestorage.app",
  messagingSenderId: "45311566450",
  appId: "1:45311566450:web:1805cda0ed9ca3d221d8eb",
  measurementId: "G-YXDQMNNPJ3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);