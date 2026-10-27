document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const password = document.getElementById('password').value.trim(); 
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('loginError');

    loginBtn.innerText = "Checking...";
    loginBtn.disabled = true;
    errorMsg.innerText = "";

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
    })
    .then(res => {
        return res.json().then(data => ({ status: res.status, body: data }));
    })
    .then(response => {
        if (response.status === 200 && response.body.success) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboardScreen').style.display = 'block';
            loadComplaints();
        } else {
            errorMsg.innerText = "❌ " + (response.body.error || "Login failed");
            loginBtn.innerText = "Login";
            loginBtn.disabled = false;
        }
    })
    .catch(err => {
        errorMsg.innerText = "❌ Cannot connect to server. Is 'node server.js' running?";
        loginBtn.innerText = "Login";
        loginBtn.disabled = false;
    });
});

const imageViewer = document.getElementById('imageViewer');
const fullSizeImage = document.getElementById('fullSizeImage');
const closeImageViewerButton = document.getElementById('closeImageViewer');
let imageViewerTrigger = null;
let previousBodyOverflow = '';

function openImageViewer(image, trigger) {
    imageViewerTrigger = trigger;
    fullSizeImage.src = image.src;
    fullSizeImage.alt = image.alt;
    imageViewer.hidden = false;
    imageViewer.setAttribute('aria-hidden', 'false');
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeImageViewerButton.focus();
}

function closeImageViewer() {
    imageViewer.hidden = true;
    imageViewer.setAttribute('aria-hidden', 'true');
    fullSizeImage.removeAttribute('src');
    document.body.style.overflow = previousBodyOverflow;
    if (imageViewerTrigger && imageViewerTrigger.isConnected) {
        imageViewerTrigger.focus();
    }
    imageViewerTrigger = null;
}

document.getElementById('tableBody').addEventListener('click', function(e) {
    const imageButton = e.target.closest('.img-preview-button');
    if (imageButton) {
        openImageViewer(imageButton.querySelector('img'), imageButton);
    }
});

closeImageViewerButton.addEventListener('click', closeImageViewer);
imageViewer.addEventListener('click', function(e) {
    if (e.target === imageViewer) {
        closeImageViewer();
    }
});
document.addEventListener('keydown', function(e) {
    if (imageViewer.hidden) {
        return;
    }
    if (e.key === 'Escape') {
        closeImageViewer();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        closeImageViewerButton.focus();
    }
});

function loadComplaints() {
    fetch('/api/complaints')
    .then(res => res.json())
    .then(data => {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = ''; 

        data.forEach(complaint => {
            const row = document.createElement('tr');
            
            let imageHTML = `<span style="font-size:12px;color:#999;">No Image</span>`;
            if (complaint.image !== 'No Image') {
                imageHTML = `<button type="button" class="img-preview-button" aria-label="View full-size issue photo"><img src="/uploads/${complaint.image}" class="img-thumb" alt="Issue Photo"></button>`;
            }

            const statusColor = complaint.status === 'Pending' ? '#e67e22' : '#27ae60';

            row.innerHTML = `
                <td>${imageHTML}</td>
                <td>${complaint.name}</td>
                <td><b>${complaint.type}</b></td>
                <td>${complaint.description}</td>
                <td>${complaint.location}</td>
                <td>${complaint.date}</td>
                <td style="color: ${statusColor}; font-weight: bold;">
                    ${complaint.status}
                </td>
                <td>
                    ${complaint.status === 'Pending' 
                        ? `<button class="btn-resolve" onclick="resolveComplaint('${complaint.id}')">Mark as Resolved</button>`
                        : '✅ Done'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    });
}

function resolveComplaint(id) {
    fetch('/api/complaints/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
    })
    .then(res => res.json())
    .then(data => {
        loadComplaints(); 
    });
}