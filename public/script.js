function toggleOtherInput() {
    const type = document.getElementById('type').value;
    const otherContainer = document.getElementById('otherTypeContainer');
    if (type === 'Other') {
        otherContainer.style.display = 'block';
        document.getElementById('otherType').required = true;
    } else {
        otherContainer.style.display = 'none';
        document.getElementById('otherType').required = false;
    }
}

document.getElementById('complaintForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const formData = new FormData();
    let finalType = document.getElementById('type').value;
    if (finalType === 'Other') finalType = document.getElementById('otherType').value;

    formData.append('name', document.getElementById('name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('type', finalType);
    formData.append('location', document.getElementById('location').value);
    formData.append('description', document.getElementById('description').value);
    
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) formData.append('image', imageFile);

    fetch('/api/complaints', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        const messageEl = document.getElementById('message');
        
        if (data.message) {
            messageEl.innerText = "✅ " + data.message;
            messageEl.style.color = "#27ae60";
            this.reset();
            document.getElementById('otherTypeContainer').style.display = 'none';
        } else {
            messageEl.innerText = "❌ " + data.error;
            messageEl.style.color = "red";
        }
    });
});

function trackComplaint() {
    const email = document.getElementById('trackEmail').value;
    if (!email) return alert("Please enter your email");

    fetch('/api/track?email=' + encodeURIComponent(email))
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById('trackResults');
        
        if (data.length === 0) {
            container.innerHTML = "<p style='color:red;'>No complaints found for this email.</p>";
            return;
        }

        let html = "";
        data.forEach(c => {
            const statusClass = c.status === 'Pending' ? 'status-pending' : 'status-resolved';
            html += `
                <div class="track-item">
                    <p><strong>Issue:</strong> ${c.type} - ${c.location}</p>
                    <p><strong>Date:</strong> ${c.date}</p>
                    <p><strong>Status:</strong> <span class="${statusClass}">${c.status}</span></p>
                </div>
            `;
        });
        container.innerHTML = html;
    });
}