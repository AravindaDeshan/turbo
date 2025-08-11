// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4E6SiAneQFYAhmlMxhkekJgDSQy7Pn0k",
  authDomain: "powerplantwarehouse-886a2.firebaseapp.com",
  projectId: "powerplantwarehouse-886a2",
  storageBucket: "powerplantwarehouse-886a2.firebasestorage.app",
  messagingSenderId: "326163430287",
  appId: "1:326163430287:web:3fd87e28212ef882ba29fa",
  measurementId: "G-S9MMW4DZEB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Check authentication state
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        console.log("User logged in:", user.email);
        
        // Set user name in all pages
        const userNameElements = document.querySelectorAll('#userName');
        if (userNameElements.length > 0) {
            userNameElements.forEach(element => {
                element.textContent = user.displayName || user.email.split('@')[0];
            });
        }
        
        // If on login page, redirect to dashboard
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        console.log("User not logged in");
        
        // If not on login page, redirect to login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Login successful
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.style.display = 'none';
                window.location.href = 'dashboard.html';
            })
            .catch(error => {
                // Login failed
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = error.message;
                errorMessage.style.display = 'block';
            });
    });
}

// Logout Button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error("Logout error:", error);
            });
    });
}

// Sidebar Toggle
const toggleSidebar = document.getElementById('toggleSidebar');
const mainContent = document.getElementById('mainContent');

if (toggleSidebar && mainContent) {
    toggleSidebar.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Change icon
        const icon = toggleSidebar.querySelector('i');
        if (icon.classList.contains('fa-bars')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}