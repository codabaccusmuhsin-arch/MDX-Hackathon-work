document.getElementById('login-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageEl = document.getElementById('message');

  if (!username || !password) {
    messageEl.style.color = 'red';
    messageEl.textContent = 'Please fill in both fields.';
    return;
  }

  const loginData = { username, password };

  try {
    const response = await fetch('/login_api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
      credentials: 'same-origin'
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.style.color = 'lightgreen';
      messageEl.textContent = data.message || 'Login successful!';
      setTimeout(() => {
        window.location.href = '/index/';  // ✅ redirect to index page
      }, 1000);
    } else {
      messageEl.style.color = 'red';
      messageEl.textContent = data.message || 'Invalid login.';
    }
  } catch (err) {
    messageEl.style.color = 'red';
    messageEl.textContent = 'Network error. Is your backend running?';
  }
});
