document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error("Failed to load configuration");
        const config = await response.json();

        // Apply Profile
        document.getElementById("profile-name").textContent = config.profile.name;
        document.getElementById("profile-bio").textContent = config.profile.bio;
        document.getElementById("profile-avatar").src = config.profile.avatar;

        // Apply Theme
        document.body.className = `theme-${config.profile.theme || 'velvet-ruby'}`;

        // Apply Custom Font if any
        if (config.profile.fontFamily && config.profile.fontFamily !== "Default") {
            document.body.style.fontFamily = `${config.profile.fontFamily}, sans-serif`;
        }

        // Render Links
        const container = document.getElementById("links-container");
        container.innerHTML = "";

        config.links.forEach(item => {
            const btn = document.createElement("a");
            btn.className = "link-btn";
            
            // Handle different types
            if (item.type === "link") {
                btn.href = item.url;
                btn.target = "_blank";
                btn.rel = "noopener noreferrer";
            } else if (item.type === "video") {
                btn.href = "#";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    openVideoModal(item.url);
                });
            } else if (item.type === "image") {
                btn.href = "#";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    openImageModal(item.url);
                });
            }

            btn.innerHTML = `
                <div class="btn-content">
                    <i class="${item.icon || 'fa-solid fa-heart'} left-icon"></i>
                    <span>${item.title}</span>
                </div>
                <i class="fa-solid fa-chevron-right right-arrow"></i>
            `;
            container.appendChild(btn);
        });

    } catch (err) {
        console.error("Error loading bio data:", err);
    }
});

// Video Modal Handler
function openVideoModal(url) {
    const modal = document.getElementById("video-modal");
    const wrapper = document.getElementById("video-player-wrapper");
    
    // Check if external embed (like Bilibili / YouTube) or local video
    if (url.includes("bilibili.com") || url.includes("youtube.com") || url.includes("iframe")) {
        wrapper.innerHTML = `<iframe src="${url}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`;
    } else {
        wrapper.innerHTML = `<video src="${url}" controls autoplay playsinline></video>`;
    }
    
    modal.style.display = "flex";
}

document.getElementById("close-video").addEventListener("click", () => {
    const modal = document.getElementById("video-modal");
    const wrapper = document.getElementById("video-player-wrapper");
    wrapper.innerHTML = "";
    modal.style.display = "none";
});

// Image Modal Handler
function openImageModal(url) {
    const modal = document.getElementById("image-modal");
    const img = document.getElementById("showcase-img");
    img.src = url;
    modal.style.display = "flex";
}

document.getElementById("close-image").addEventListener("click", () => {
    document.getElementById("image-modal").style.display = "none";
});

// Close modal on outside click
window.addEventListener("click", (e) => {
    const videoModal = document.getElementById("video-modal");
    const imageModal = document.getElementById("image-modal");
    if (e.target === videoModal) {
        videoModal.style.display = "none";
        document.getElementById("video-player-wrapper").innerHTML = "";
    }
    if (e.target === imageModal) {
        imageModal.style.display = "none";
    }
});
