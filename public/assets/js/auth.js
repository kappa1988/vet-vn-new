// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, get, child, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js"; // Import Realtime Database functions and 'set'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBrbjl8UkEY8NDqW6YYutGn9Zbnp-h3g8",
  authDomain: "vet-vn.firebaseapp.com",
  projectId: "vet-vn",
  storageBucket: "vet-vn.firebasestorage.app",
  messagingSenderId: "396332770811",
  appId: "1:396332770811:web:e5c5f522a60b43b904175e",
  measurementId: "G-Q06C88CZ99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get the Auth service instance
const database = getDatabase(app); // Get the Realtime Database service instance

// Google Login (login.html)
const googleLoginBtn = document.getElementById('google-login-btn');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log('User signed in:', result.user);
                // ログイン後のリダイレクトはauth.onAuthStateChangedで処理される
            })
            .catch((error) => {
                console.error('Google login error:', error);
                alert('Googleログインに失敗しました: ' + error.message);
            });
    });
}

// Google Register (register.html)
const googleRegisterBtn = document.getElementById('google-register-btn');
const registerMessage = document.getElementById('register-message'); // registerMessageをグローバルスコープで取得

// ページロード時にregister.htmlにいる場合、ログイン状態をチェック
if (window.location.pathname.endsWith('register.html')) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const dbRef = ref(database);
            try {
                const [approvedSnapshot, pendingSnapshot] = await Promise.all([
                    get(child(dbRef, `approvedMembers/${user.uid}`)),
                    get(child(dbRef, `pendingMembers/${user.uid}`))
                ]);

                if (approvedSnapshot.exists()) {
                    if (registerMessage) {
                        registerMessage.style.display = 'block';
                        registerMessage.textContent = 'あなたはすでに承認された会員です。ログインページへ移動します。';
                    }
                    // ログインページへの誘導ボタンを表示するなど
                    // window.location.href = 'login.html'; // 自動リダイレクトはしない
                } else if (pendingSnapshot.exists()) {
                    if (registerMessage) {
                        registerMessage.style.display = 'block';
                        registerMessage.textContent = 'あなたはすでに登録済みです。管理者の承認をお待ちください。';
                    }
                } else {
                    // ログインしているが、approvedでもpendingでもない場合（通常はありえないが念のため）
                    if (registerMessage) {
                        registerMessage.style.display = 'block';
                        registerMessage.textContent = 'ログイン済みですが、登録情報が見つかりません。新規登録してください。';
                    }
                }
                // 登録ボタンを非表示にする
                if (googleRegisterBtn) {
                    googleRegisterBtn.style.display = 'none';
                }
            } catch (error) {
                console.error('Error checking user status on register page load:', error);
                if (registerMessage) {
                    registerMessage.style.display = 'block';
                    registerMessage.textContent = 'ユーザー状態の確認中にエラーが発生しました。';
                }
            }
        } else {
            // ログインしていない場合は登録ボタンを表示
            if (googleRegisterBtn) {
                googleRegisterBtn.style.display = 'inline-flex'; // flexにしてGoogleアイコンとテキストが並ぶように
            }
            if (registerMessage) {
                registerMessage.style.display = 'none'; // メッセージは非表示
            }
        }
    });
}


if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                // registerMessageはすでにグローバルスコープで取得済み

                // Check if user is already in approvedMembers or pendingMembers
                const dbRef = ref(database);
                Promise.all([
                    get(child(dbRef, `approvedMembers/${user.uid}`)),
                    get(child(dbRef, `pendingMembers/${user.uid}`))
                ]).then(([approvedSnapshot, pendingSnapshot]) => {
                    if (approvedSnapshot.exists()) {
                        if (registerMessage) {
                            registerMessage.style.display = 'block';
                            registerMessage.textContent = 'あなたはすでに承認された会員です。ログインページへ移動します。';
                        }
                        // window.location.href = 'login.html'; // 自動リダイレクトはしない
                    } else if (pendingSnapshot.exists()) {
                        if (registerMessage) {
                            registerMessage.style.display = 'block';
                            registerMessage.textContent = 'あなたはすでに登録済みです。管理者の承認をお待ちください。';
                        }
                    } else {
                        // User is new, add to pendingMembers
                        set(ref(database, 'pendingMembers/' + user.uid), {
                            email: user.email,
                            displayName: user.displayName,
                            registeredAt: new Date().toISOString()
                        }).then(() => {
                            console.log('User added to pendingMembers:', user.uid);
                            if (registerMessage) {
                                registerMessage.style.display = 'block';
                                registerMessage.textContent = '登録が完了しました。管理者の承認をお待ちください。';
                            }
                            // 登録ボタンを非表示にする
                            if (googleRegisterBtn) {
                                googleRegisterBtn.style.display = 'none';
                            }
                        }).catch((error) => {
                            console.error('Error adding user to pendingMembers:', error);
                            if (registerMessage) {
                                registerMessage.style.display = 'block';
                                registerMessage.textContent = '登録中にエラーが発生しました: ' + error.message;
                            }
                        });
                    }
                }).catch((error) => {
                    console.error('Error checking user status:', error);
                    if (registerMessage) {
                        registerMessage.style.display = 'block';
                        registerMessage.textContent = 'ユーザー状態の確認中にエラーが発生しました: ' + error.message;
                    }
                });
            })
            .catch((error) => {
                console.error('Google registration error:', error);
                if (registerMessage) {
                    registerMessage.style.display = 'block';
                    registerMessage.textContent = 'Google登録に失敗しました: ' + error.message;
                }
            });
    });
}

// Handle authentication state changes (この部分はregister.htmlのチェックは残す)
onAuthStateChanged(auth, async (user) => {
    const membersContent = document.getElementById('members-content');
    const logoutBtnContainer = document.getElementById('logout-btn-container');

    // 現在のページがregister.htmlの場合は、承認チェックとリダイレクトを行わない
    if (window.location.pathname.endsWith('register.html')) {
        // ログアウトボタンの表示/非表示はregister.htmlでは不要なので、ここでは何もしないか、非表示にする
        if (logoutBtnContainer) {
            logoutBtnContainer.style.display = 'none';
        }
        return; // register.htmlではこれ以上の処理は不要
    }

    if (user) {
        // User is signed in, now check if they are an approved member
        const dbRef = ref(database);
        try {
            const snapshot = await get(child(dbRef, `approvedMembers/${user.uid}`));
            if (snapshot.exists()) {
                // User is an approved member
                if (membersContent) {
                    membersContent.style.display = 'block';
                }
                if (logoutBtnContainer) {
                    logoutBtnContainer.style.display = 'block';
                }
                console.log('User is signed in and approved:', user.displayName);
            } else {
                // User is signed in but NOT an approved member
                console.log('User is signed in but not an approved member:', user.displayName);
                // alert('あなたは承認された会員ではありません。'); // このアラートはregister.htmlでは出ないようにする
                if (membersContent) { // membersContentがあるページでのみ表示
                    membersContent.style.display = 'none';
                }
                if (logoutBtnContainer) {
                    logoutBtnContainer.style.display = 'none';
                }
                alert('あなたは承認された会員ではありません。'); // 他のページではアラートを出す
                signOut(auth); // Log out the unapproved user
                if (window.location.pathname.endsWith('members.html') || window.location.pathname.endsWith('index.html')) { // members.htmlまたはindex.htmlの場合のみリダイレクト
                    window.location.href = 'login.html'; // Redirect to login page
                }
            }
        } catch (error) {
            console.error("Error checking approved members:", error);
            // alert("会員情報の確認中にエラーが発生しました。"); // このアラートもregister.htmlでは出ないようにする
            if (membersContent) { // membersContentがあるページでのみ表示
                membersContent.style.display = 'none';
            }
            if (logoutBtnContainer) {
                logoutBtnContainer.style.display = 'none';
            }
            alert("会員情報の確認中にエラーが発生しました。"); // 他のページではアラートを出す
            signOut(auth); // Log out on error
            if (window.location.pathname.endsWith('members.html') || window.location.pathname.endsWith('index.html')) { // members.htmlまたはindex.htmlの場合のみリダイレクト
                window.location.href = 'login.html'; // Redirect to login page
            }
        }
    } else {
        // User is signed out
        if (membersContent) {
            membersContent.style.display = 'none';
        }
        if (logoutBtnContainer) {
            logoutBtnContainer.style.display = 'none';
        }
        console.log('User is signed out.');
        // Only redirect if not already on the login page to prevent infinite loops
        if (window.location.pathname.endsWith('members.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Optional: Logout function (can be called from a logout button)
function signOutUser() {
    signOut(auth).then(() => { // Use signOut from firebase/auth
        console.log('User signed out successfully.');
        window.location.href = 'login.html'; // Redirect to login page after logout
    }).catch((error) => {
        console.error('Logout error:', error);
        alert('ログアウトに失敗しました: ' + error.message);
    });
}

// Expose signOutUser to the global scope if needed for HTML buttons
window.signOutUser = signOutUser;