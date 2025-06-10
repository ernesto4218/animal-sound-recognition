document.querySelector('#threshold_filter').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    // Collect values
    const probability = this.elements['probability'].value;
    const overlap = this.elements['overlap'].value;
    const percent = this.elements['percent'].value;
    const filterAllow = this.elements['filter_allow'].value;
    const filterDeny = this.elements['filter_deny'].value;

    // Package data as JSON
    const payload = {
      probability,
      overlap,
      percent,
      filter_allow: filterAllow,
      filter_deny: filterDeny
    };

    try {
      const response = await fetch('/api/save-settings-t-f', {
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

const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileElem");

// Optional: handle file input change
fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
});

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight on drag over
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add("bg-gray-100"), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove("bg-gray-100"), false);
});

// Handle dropped files
dropArea.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
});

async function handleFiles(files) {
  const file = files[0];

  if (!file || !file.name.endsWith('.zip')) {
    return showToast('error', 'Please upload a .zip file only.');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload-model', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    showToast(data.status || 'success', data.message || 'File uploaded successfully.');
    setTimeout(() => {
        location.reload();
    }, 1000);
  } catch (err) {
    console.error(err);
    showToast('error', err.message || 'Upload failed.');
  }
}

// use model
document.querySelectorAll('.date-display').forEach(el => {
    const rawDate = new Date(el.dataset.date);

    const options = {
    weekday: 'short',  // "Wed"
    month: 'short',    // "May"
    day: 'numeric',    // "28"
    hour: 'numeric',   // "9"
    minute: '2-digit', // "12"
    hour12: true       // "AM"
    };

    el.textContent = `Date : ${rawDate.toLocaleString('en-US', options)}`;
});

document.querySelectorAll(".use-model-btn").forEach(button => {
  button.addEventListener("click", async function () {
    const modelId = this.getAttribute("data-id");
    console.log("Clicked model ID:", modelId);

    const formData = new FormData();
    formData.append('model_id', modelId);

    try {
        const response = await fetch('/api/use-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_id: modelId }),
        });


        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        document.querySelector("#activeModelTXT").textContent = data.model;

        showToast(data.status || 'success', data.message || 'Model activated.');

        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (err) {
        console.error(err);
        showToast('error', err.message || 'Upload failed.');
    }
  });
});

document.querySelectorAll(".delete-model-btn").forEach(button => {
  button.addEventListener("click", async function () {
    const modelId = this.getAttribute("data-id");
    console.log(modelId);
    showModal({
        title: 'Delete Model?',
        description: 'Are you sure you want to delete this machine learning model? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => {
            console.log('Confirmed!');
            console.log("Clicked model ID:", modelId);

            try {
                const response = await fetch('/api/delete-model', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model_id: modelId }),
                });


                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                showToast(data.status || 'success', data.message || 'Model deleted successfully.');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (err) {
                console.error(err);
                showToast('error', err.message || 'Delete failed.');
            }
        }
    });
  });
});

const addphotoclassbtn = document.getElementById('addphotoclassbtn');
addphotoclassbtn.onclick = function() {
    addPhotoClassFormContainer.classList.remove('hidden');
    addPhotoClassFormContainer.classList.add('flex');
};

document.getElementById('uploadClassPhotoSubmitFormBTN').onclick = async function (e) {
    e.preventDefault(); // Prevent form from submitting normally

    const form = document.getElementById('AddPhotoClassFoorm');
    const className = form.querySelector('input[name="class_name"]').value;
    const fileInput = document.getElementById('productImage');
    const file = fileInput.files[0];

    if (!className || !file) {
        showToast('warning','Please fill in the class name and select an image.');
        return;
    }

    const formData = new FormData();
    formData.append('class_name', className);
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload-photo-class', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (result.status === 'success') {
            showToast('success','Image uploaded successfully!');
            form.reset();
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            showToast('error','Upload failed: ' + result.message);
        }
    } catch (err) {
        console.error('Upload error:', err);
        showToast('error','Something went wrong during upload.');
    }
};

document.querySelectorAll(".delete-class-photo-btn").forEach(button => {
  button.addEventListener("click", async function () {
    const class_id = this.getAttribute("data-id");
    console.log(class_id);
    showModal({
        title: 'Delete Photo?',
        description: 'Are you sure you want to delete this photo of a class? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => {
            console.log('Confirmed!');
            console.log("Clicked model ID:", class_id);

            try {
                const response = await fetch('/api/delete-photo-class', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ class_id: class_id }),
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                showToast(data.status || 'success', data.message || 'Photo deleted successfully.');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } catch (err) {
                console.error(err);
                showToast('error', err.message || 'Delete failed.');
            }
        }
    });
  });
});

// notify chekbox
document.querySelectorAll('#notify-danger-checkbox').forEach(check => {
    check.onclick = async function () {
        const id = this.getAttribute("data-id");
        console.log("Clicked ID:", id);
        console.log(this.checked);

        try {
            const response = await fetch('/api/notify-enable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, checked: this.checked }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            showToast(data.status || 'success', data.message || 'Notification Enabled');
        } catch (err) {
            console.error(err);
            showToast('error', err.message || 'Delete failed.');
        }

    }
});