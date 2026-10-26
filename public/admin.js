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
                imageHTML = `<img src="/uploads/${complaint.image}" class="img-thumb" alt="Issue Photo">`;
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
                        ? `<button class="btn-resolve" onclick="resolveComplaint(${complaint.id})">Mark as Resolved</button>` 
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