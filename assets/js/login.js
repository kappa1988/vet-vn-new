
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission

            const correctPassword = 'vet-vn'; // The password
            const enteredPassword = passwordInput.value;

            if (enteredPassword === correctPassword) {
                // Redirect to the protected video page
                window.location.href = 'videos-protected.html';
            } else {
                errorMessage.style.display = 'block'; // Show error message
            }
        });
    }
});
