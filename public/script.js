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
    const email = document.getElementById('trackEmail').value.trim();
    const container = document.getElementById('trackResults');
    container.replaceChildren();

    if (!email) {
        container.textContent = "Please enter your email address.";
        return;
    }

    container.textContent = "Checking your reports...";

    fetch('/api/track?email=' + encodeURIComponent(email))
    .then(async res => {
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Unable to retrieve reports.");
        }
        return data;
    })
    .then(data => {
        container.replaceChildren();
        if (data.length === 0) {
            container.textContent = "No complaints found for this email.";
            return;
        }

        data.forEach(c => {
            const item = document.createElement('article');
            item.className = 'track-item';

            const heading = document.createElement('h3');
            heading.className = 'track-item-title';
            heading.textContent = c.type || 'Complaint';
            item.appendChild(heading);

            appendTrackingDetail(item, 'Location', c.location);
            appendTrackingDetail(item, 'Date submitted', c.date);
            appendTrackingDetail(item, 'Description', c.description);

            const status = document.createElement('p');
            const statusLabel = document.createElement('strong');
            statusLabel.textContent = 'Status: ';
            const statusValue = document.createElement('span');
            statusValue.className = c.status === 'Resolved' ? 'status-resolved' : 'status-pending';
            statusValue.textContent = c.status || 'Unknown';
            status.append(statusLabel, statusValue);
            item.appendChild(status);

            if (c.image && c.image !== 'No Image') {
                const imageButton = document.createElement('button');
                imageButton.type = 'button';
                imageButton.className = 'track-image-button';
                imageButton.setAttribute('aria-label', 'View full-size complaint photo');

                const image = document.createElement('img');
                image.className = 'track-image';
                image.src = '/uploads/' + encodeURIComponent(c.image);
                image.alt = 'Photo submitted with this complaint';
                imageButton.appendChild(image);
                item.appendChild(imageButton);
            } else {
                appendTrackingDetail(item, 'Photo', 'No photo uploaded');
            }

            container.appendChild(item);
        });
    })
    .catch(error => {
        container.textContent = error.message || "Unable to retrieve reports. Please try again.";
    });
}

function appendTrackingDetail(container, label, value) {
    const detail = document.createElement('p');
    const detailLabel = document.createElement('strong');
    detailLabel.textContent = label + ': ';
    detail.append(detailLabel, document.createTextNode(value || 'Not provided'));
    container.appendChild(detail);
}

const trackingImageViewer = document.getElementById('trackingImageViewer');
const trackingFullSizeImage = document.getElementById('trackingFullSizeImage');
const closeTrackingImageViewerButton = document.getElementById('closeTrackingImageViewer');
let trackingImageViewerTrigger = null;
let trackingPreviousBodyOverflow = '';

document.getElementById('trackResults').addEventListener('click', function(e) {
    const imageButton = e.target.closest('.track-image-button');
    if (!imageButton) return;

    trackingImageViewerTrigger = imageButton;
    trackingFullSizeImage.src = imageButton.querySelector('img').src;
    trackingFullSizeImage.alt = imageButton.querySelector('img').alt;
    trackingImageViewer.hidden = false;
    trackingImageViewer.setAttribute('aria-hidden', 'false');
    trackingPreviousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeTrackingImageViewerButton.focus();
});

function closeTrackingImageViewer() {
    trackingImageViewer.hidden = true;
    trackingImageViewer.setAttribute('aria-hidden', 'true');
    trackingFullSizeImage.removeAttribute('src');
    document.body.style.overflow = trackingPreviousBodyOverflow;
    if (trackingImageViewerTrigger && trackingImageViewerTrigger.isConnected) {
        trackingImageViewerTrigger.focus();
    }
    trackingImageViewerTrigger = null;
}

closeTrackingImageViewerButton.addEventListener('click', closeTrackingImageViewer);
trackingImageViewer.addEventListener('click', function(e) {
    if (e.target === trackingImageViewer) {
        closeTrackingImageViewer();
    }
});
document.addEventListener('keydown', function(e) {
    if (trackingImageViewer.hidden) return;
    if (e.key === 'Escape') {
        closeTrackingImageViewer();
    } else if (e.key === 'Tab') {
        e.preventDefault();
        closeTrackingImageViewerButton.focus();
    }
});