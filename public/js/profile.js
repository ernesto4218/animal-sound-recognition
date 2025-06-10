document.querySelector('#personalinfoform').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    // Collect values
    const first = this.elements['firstname'].value;
    const middle = this.elements['middlename'].value;
    const last = this.elements['lastname'].value;
    const email = this.elements['email'].value;
    const phone = this.elements['phone'].value;

    // Package data as JSON
    const payload = {
      first: first,
      middle: middle,
      last: last,
      email: email,
      phone: phone,
    };

    console.log(payload);

    try {
      const response = await fetch('/api/save-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN', // Optional: if auth is needed
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings.');
      }

      const result = await response.json();
      console.log(result);
      showToast(result.status, result.message);
      setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
      console.error('Error:', error);
      showToast('error', error)
    }
});

document.querySelector('#changePassForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    // Collect values
    const newpass = this.elements['newpass'].value;
    const confirmnewpass = this.elements['confirmnewpass'].value;

    // Package data as JSON
    const payload = {
      newpass: newpass,
      confirm: confirmnewpass,
    };

    // console.log(payload);

    try {
      const response = await fetch('/api/change-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_TOKEN', // Optional: if auth is needed
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings.');
      }

      const result = await response.json();
      console.log(result);
      
      showToast(result.status, result.message);
    } catch (error) {
      console.error('Error:', error);
      showToast('error', error)
    }
});
