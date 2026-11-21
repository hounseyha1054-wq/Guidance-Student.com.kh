// Firebase Authentication Integration for Student Guidance System
// Project: Student-Guidane (student-guidane)

const firebaseConfig = {
    apiKey: "AIzaSyDZiz0-wZXrOcNsNXyW3YIVgdk9wSZRjAA",
    authDomain: "student-guidane.firebaseapp.com",
    projectId: "student-guidane",
    storageBucket: "student-guidane.firebasestorage.app",
    messagingSenderId: "809565342497",
    appId: "1:809565342497:web:38d2077f7e416c48954c60"
};

// Initialize Firebase if not already initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const googleProvider = (typeof firebase !== 'undefined') ? new firebase.auth.GoogleAuthProvider() : null;

/**
 * Handle Google Sign-In with Firebase popup
 */
async function handleFirebaseGoogleLogin() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        showAuthAlert('Firebase Auth library failed to load. Please check your internet connection.', 'danger');
        return;
    }

    const googleBtn = document.getElementById('googleLoginBtn') || document.querySelector('.google-login-btn');
    const originalBtnHtml = googleBtn ? googleBtn.innerHTML : '';

    try {
        if (googleBtn) {
            googleBtn.disabled = true;
            googleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing in with Google...';
        }

        const result = await firebase.auth().signInWithPopup(googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();

        // Determine user_type if present on the page (e.g. login.html tab toggle)
        const userTypeInput = document.getElementById('userTypeInput');
        const userType = userTypeInput ? userTypeInput.value : 'user';

        // Send authenticated user info to Flask backend session endpoint
        const response = await fetch('/auth/firebase-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                uid: user.uid,
                idToken: idToken,
                user_type: userType
            })
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirect_url || '/account';
        } else {
            showAuthAlert(data.message || 'Authentication error from server.', 'danger');
            if (googleBtn) {
                googleBtn.disabled = false;
                googleBtn.innerHTML = originalBtnHtml;
            }
        }
    } catch (error) {
        console.error('Firebase Google Sign-In Error:', error);
        if (googleBtn) {
            googleBtn.disabled = false;
            googleBtn.innerHTML = originalBtnHtml;
        }

        if (error.code === 'auth/popup-closed-by-user') {
            // User closed the popup window before finishing
            return;
        }

        if (error.code === 'auth/unauthorized-domain') {
            if (window.location.hostname === '127.0.0.1') {
                const localhostUrl = window.location.href.replace('127.0.0.1', 'localhost');
                showAuthAlert(`<b>Domain unauthorized:</b> In Firebase Console, <code>localhost</code> is authorized, but your browser is opening on <code>127.0.0.1</code>.<br><br>👉 <a href="${localhostUrl}" class="btn btn-sm btn-primary mt-2 d-inline-block fw-bold text-white">Switch to http://localhost:5000</a><br><small class="text-muted d-block mt-2">Alternatively, click <b>"Add domain"</b> in Firebase Console and add <code>127.0.0.1</code>.</small>`, 'warning');
            } else {
                showAuthAlert(`Domain <code>${window.location.hostname}</code> is unauthorized in Firebase. In Firebase Console, go to Authentication > Settings > Authorized domains, and click <b>Add domain</b> to add this domain.`, 'warning');
            }
        } else if (error.code === 'auth/operation-not-allowed') {
            showAuthAlert('Google Sign-in is not enabled in Firebase Console. Go to Authentication > Sign-in method > Google, and click Enable.', 'warning');
        } else {
            showAuthAlert(error.message || 'Failed to sign in with Google.', 'danger');
        }
    }
}

/**
 * Display alert messages dynamically on the page
 */
function showAuthAlert(message, type = 'danger') {
    let alertDiv = document.getElementById('firebaseErrorAlert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'firebaseErrorAlert';
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        const form = document.getElementById('loginForm') || document.getElementById('registerForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(alertDiv, form);
        }
    } else {
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    }

    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertDiv.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Bind event listeners to Google buttons
document.addEventListener('DOMContentLoaded', function() {
    const googleBtns = document.querySelectorAll('.google-login-btn, #googleLoginBtn, a[href*="google_login"]');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            handleFirebaseGoogleLogin();
        });
    });
});
