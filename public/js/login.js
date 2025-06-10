document.getElementById('loginform').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form from submitting

    const email = this.elements['email'].value;
    const password = this.elements['password'].value;
    const rememberMe = document.getElementById('rememberMe').checked;

    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Remember Me:', rememberMe);

    // You can now send these values via fetch() or AJAX
    const payload = {
      email: email,
      password: password,
      rememberMe: rememberMe
    };

    fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json(); // or response.text() if server doesn't send JSON
    })
    .then(data => {
      showToast(data.status, data.message);

      if (data.status === 'success'){
        setTimeout(() => {
            location.replace('/home');
        }, 1000);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      // Handle errors (e.g., show error message)
    });
});