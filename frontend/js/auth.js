import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

const googleLoginButton = document.getElementById("googleLogin");
const logoutButton = document.getElementById("logout");
const userInfo = document.getElementById("userInfo");

googleLoginButton.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        console.log("Logged in user:", user);

    } catch (error) {
        console.error("Google login failed:", error);
    }
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
});

onAuthStateChanged(auth, async (user) => {

    if (user) {

        googleLoginButton.style.display = "none";
        logoutButton.style.display = "block";

        userInfo.textContent = `Logged in as ${user.displayName}`;

        await getMyProfile(user);

    } else {

        googleLoginButton.style.display = "block";
        logoutButton.style.display = "none";

        userInfo.textContent = "";
    }
});

async function getMyProfile(user) {
    const idToken = await user.getIdToken();

    const response = await fetch(
        "http://localhost:3016/api/users/me",
        {
            headers: {
                Authorization: `Bearer ${idToken}`
            }
        }
    );

    const data = await response.json();

    console.log("My profile:", data);
}