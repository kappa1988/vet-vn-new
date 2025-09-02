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

// --- Helpers ---
const isPath = (suffix) => window.location.pathname.endsWith(suffix);

async function ensureFreeApproval(uid) {
  try {
    const dbRef = ref(database);
    const approved = await get(child(dbRef, `approvedMembers/${uid}`));
    if (!approved.exists()) {
      await set(child(dbRef, `approvedMembers/${uid}`), {
        plan: 'free',
        status: 'active',
        createdAt: Date.now()
      });
    }
  } catch (e) {
    console.error('ensureFreeApproval error', e);
  }
}

async function loadProfile(uid, user) {
  const snap = await get(child(ref(database), `profiles/${uid}`));
  const data = snap.exists() ? snap.val() : {};
  return {
    displayName: data.displayName || (user?.displayName || ''),
    role: data.role || 'その他',
    organization: data.organization || ''
  };
}

async function saveProfile(uid, payload) {
  await set(child(ref(database), `profiles/${uid}`), {
    displayName: payload.displayName,
    role: payload.role,
    organization: payload.organization,
    updatedAt: Date.now()
  });
}

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
        // 全員無料枠の自動承認（なければ作成）
        await ensureFreeApproval(user.uid);
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

                // ログイン済みのときはヘッダーに「My Page」を追加
                try {
                  const navList = document.querySelector('.nav-list');
                  if (navList && !navList.querySelector('a[href="/members/mypage.html"]')) {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.href = '/members/mypage.html';
                    a.textContent = 'My Page';
                    li.appendChild(a);
                    navList.appendChild(li);
                  }
                } catch (e) {
                  console.warn('nav update skipped', e);
                }

                // マイページ: フォームの表示とデータ同期
                if (isPath('/members/mypage.html')) {
                    const form = document.getElementById('profile-form');
                    const notLogged = document.getElementById('not-logged');
                    const notApproved = document.getElementById('not-approved');
                    const nameInput = document.getElementById('fullName');
                    const orgInput = document.getElementById('organization');
                    const emailSpan = document.getElementById('accountEmail');
                    const saveBtn = document.getElementById('saveProfile');
                    const saveStatus = document.getElementById('saveStatus');

                    if (notLogged) notLogged.style.display = 'none';
                    if (notApproved) notApproved.style.display = 'none';
                    if (emailSpan) emailSpan.textContent = user.email || '';

                    // ロード
                    try {
                        const prof = await loadProfile(user.uid, user);
                        if (nameInput) nameInput.value = prof.displayName || '';
                        if (orgInput) orgInput.value = prof.organization || '';
                        const roleInputs = document.querySelectorAll('input[name="role"]');
                        roleInputs.forEach(r => {
                            if (r.value === (prof.role || 'その他')) r.checked = true;
                        });
                    } catch (e) {
                        console.error('loadProfile error', e);
                    }

                    if (form) form.style.display = 'block';

                    // 保存
                    if (form) {
                        form.addEventListener('submit', async (ev) => {
                            ev.preventDefault();
                            const roleSel = /** @type {HTMLInputElement|null} */(document.querySelector('input[name="role"]:checked'));
                            const payload = {
                                displayName: (nameInput?.value || '').trim(),
                                role: roleSel ? roleSel.value : 'その他',
                                organization: (orgInput?.value || '').trim()
                            };
                            if (!payload.displayName) {
                                saveStatus.textContent = '本名を入力してください';
                                return;
                            }
                            try {
                                saveBtn.disabled = true;
                                saveStatus.textContent = '保存中…';
                                await saveProfile(user.uid, payload);
                                saveStatus.textContent = '保存しました';
                            } catch (e) {
                                console.error('saveProfile error', e);
                                saveStatus.textContent = '保存に失敗しました';
                            } finally {
                                saveBtn.disabled = false;
                            }
                        });
                    }
                }
            } else {
                // User is signed in but NOT an approved member
                console.log('User is signed in but not an approved member:', user.displayName);
                // 自動承認を試みた直後でも反映に遅延が出る場合があるため、マイページでは案内表示
                if (isPath('/members/mypage.html')) {
                    const notApproved = document.getElementById('not-approved');
                    const notLogged = document.getElementById('not-logged');
                    if (notLogged) notLogged.style.display = 'none';
                    if (notApproved) notApproved.style.display = 'block';
                    // 少し待ってから再読込
                    setTimeout(() => window.location.reload(), 1500);
                }
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
