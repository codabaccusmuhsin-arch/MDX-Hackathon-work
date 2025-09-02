document.getElementById('signup-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const username = document.getElementById('username').value.trim();
  const dob = document.getElementById('dob').value;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const messageEl = document.getElementById('message');

  if (!name || !username || !dob || !email || !password) {
    messageEl.style.color = 'red';
    messageEl.textContent = 'Please fill in all fields.';
    return;
  }

  const userData = { name, username, dateOfBirth: dob, email, password };

  try {
    const response = await fetch('/signup_api/', {   // ✅ POST to API URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.style.color = 'lightgreen';
      messageEl.textContent = data.message || 'Sign-up successful!';
      this.reset();
      setTimeout(() => { window.location.href = '/login/'; }, 1000);
    } else {
      messageEl.style.color = 'red';
      messageEl.textContent = data.message || 'Error occurred.';
    }
  } catch (err) {
    messageEl.style.color = 'red';
    messageEl.textContent = 'Network error. Is your backend running?';
  }
});
