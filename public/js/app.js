let globalConfig = null;
let pendingActionItem = null;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error("Failed to load configuration");
        globalConfig = await response.json();

        // 需求 1：动态设置浏览器标签页标题
        const siteName = globalConfig.profile.name || "sisiyyiyi";
        document.title = `${siteName} | Official Link Hub`;

        // Apply Profile
        document.getElementById("profile-name").textContent = siteName;
        document.getElementById("profile-bio").textContent = globalConfig.profile.bio;
        document.getElementById("profile-avatar").src = globalConfig.profile.avatar;

        if (globalConfig.profile.backgroundImage) {
            document.getElementById("site-bg").style.backgroundImage = `url('${globalConfig.profile.backgroundImage}')`;
        }

        document.body.className = `theme-${globalConfig.profile.theme || 'velvet-ruby'}`;

        if (globalConfig.profile.fontFamily && globalConfig.profile.fontFamily !== "Default") {
            document.body.style.fontFamily = `${globalConfig.profile.fontFamily}, sans-serif`;
        }

        // Render Links (Filter out hidden links)
        const container = document.getElementById("links-container");
        container.innerHTML = "";

        const visibleLinks = (globalConfig.links || []).filter(item => !item.isHidden);

        visibleLinks.forEach(item => {
            const btn = document.createElement("a");
            btn.className = "link-btn";
            btn.href = "#";

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                if (item.isLocked) {
                    pendingActionItem = item;
                    openPasswordModal();
                } else {
                    executeItemAction(item);
                }
            });

            btn.innerHTML = `
                <div class="btn-content">
                    <i class="${item.icon || 'fa-solid fa-heart'} left-icon"></i>
                    <span>${item.title}</span>
                    ${item.isLocked ? '<i class="fa-solid fa-lock" style="margin-left:8px;font-size:0.8rem;color:#ffd166;" title="受密码保护"></i>' : ''}
                </div>
                <i class="fa-solid fa-chevron-right right-arrow"></i>
            `;
            container.appendChild(btn);
        });

    } catch (err) {
        console.error("Error loading bio data:", err);
    }
});

// 需求 4：更多功能页面交互逻辑
const moreModal = document.getElementById("more-features-modal");
document.getElementById("open-features-btn").addEventListener("click", () => {
    moreModal.style.display = "flex";
});
document.getElementById("close-features-btn").addEventListener("click", () => {
    moreModal.style.display = "none";
});

// 二维码保存按钮
document.getElementById("download-qr-btn").addEventListener("click", async () => {
    try {
        const qrUrl = document.getElementById("feature-qr-img").src;
        const res = await fetch(qrUrl);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sisiyyiyi-home-qrcode.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        window.open(document.getElementById("feature-qr-img").src, "_blank");
    }
});

// 投诉/举报按钮：点击后延展显示表单
const toggleReportBtn = document.getElementById("toggle-report-btn");
const reportForm = document.getElementById("report-form");
toggleReportBtn.addEventListener("click", () => {
    if (reportForm.style.display === "none") {
        reportForm.style.display = "flex";
        toggleReportBtn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> 收起举报窗口`;
    } else {
        reportForm.style.display = "none";
        toggleReportBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 投诉/举报`;
    }
});

// 举报表单提交与必填项验证、变色提醒
reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const reasonInput = document.getElementById("report-reason");
    const phoneInput = document.getElementById("report-phone");
    const qqInput = document.getElementById("report-qq");
    const tips = document.getElementById("report-tips");

    let isValid = true;
    [reasonInput, phoneInput, qqInput].forEach(input => {
        if (!input.value.trim()) {
            input.classList.add("input-error");
            isValid = false;
        } else {
            input.classList.remove("input-error");
        }
    });

    if (!isValid) {
        tips.style.color = "#ff6b6b";
        tips.textContent = "请完整填写所有必填项（红框标记处）才能提交！";
        return;
    }

    try {
        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reason: reasonInput.value.trim(),
                phone: phoneInput.value.trim(),
                qq: qqInput.value.trim()
            })
        });
        const data = await res.json();
        if (data.success) {
            tips.style.color = "#2ec4b6";
            tips.textContent = "举报信息已成功提交至后台，感谢您的反馈！";
            reasonInput.value = "";
            phoneInput.value = "";
            qqInput.value = "";
            setTimeout(() => {
                reportForm.style.display = "none";
                tips.textContent = "";
                toggleReportBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 投诉/举报`;
            }, 2500);
        } else {
            tips.style.color = "#ff6b6b";
            tips.textContent = data.message || "提交失败";
        }
    } catch (err) {
        tips.style.color = "#ff6b6b";
        tips.textContent = "网络异常，提交失败";
    }
});

// 执行按钮原本的功能
function executeItemAction(item) {
    if (item.type === "link") {
        window.open(item.url, "_blank", "noopener,noreferrer");
    } else if (item.type === "video") {
        openVideoModal(item.url);
    } else if (item.type === "image") {
        openImageModal(item.url);
    }
}

// 密码弹窗控制
function openPasswordModal() {
    document.getElementById("access-password-input").value = "";
    document.getElementById("password-error").textContent = "";
    document.getElementById("password-modal").style.display = "flex";
}

document.getElementById("close-password").addEventListener("click", () => {
    document.getElementById("password-modal").style.display = "none";
    pendingActionItem = null;
});

document.getElementById("password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inputPass = document.getElementById("access-password-input").value;
    const correctPass = globalConfig.profile.linkPassword || "123456";

    if (inputPass === correctPass) {
        document.getElementById("password-modal").style.display = "none";
        if (pendingActionItem) {
            executeItemAction(pendingActionItem);
            pendingActionItem = null;
        }
    } else {
        document.getElementById("password-error").textContent = "密码错误，请重新输入";
    }
});

// Video Modal Handler
function openVideoModal(url) {
    const modal = document.getElementById("video-modal");
    const wrapper = document.getElementById("video-player-wrapper");
    let embedUrl = url;
    
    if (url.includes("bilibili.com") || url.includes("b23.tv") || url.includes("BV")) {
        const bvidMatch = url.match(/(BV[a-zA-Z0-9]+)/);
        if (bvidMatch) {
            embedUrl = `https://player.bilibili.com/player.html?bvid=${bvidMatch[1]}&high_quality=1&danmaku=0&autoplay=1`;
        }
    } else if (url.includes("youtube.com/watch?v=")) {
        const vt = new URL(url).searchParams.get("v");
        if (vt) embedUrl = `https://www.youtube.com/embed/${vt}?autoplay=1`;
    } else if (url.includes("youtu.be/")) {
        const parts = url.split("youtu.be/");
        if (parts[1]) {
            const vt = parts[1].split("?")[0];
            embedUrl = `https://www.youtube.com/embed/${vt}?autoplay=1`;
        }
    }

    if (embedUrl.includes("player.bilibili.com") || embedUrl.includes("youtube.com/embed") || embedUrl.includes("iframe")) {
        wrapper.innerHTML = `<iframe src="${embedUrl}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%;height:100%;position:absolute;top:0;left:0;border-radius:10px;"></iframe>`;
    } else {
        wrapper.innerHTML = `<video src="${embedUrl}" controls autoplay playsinline style="width:100%;height:100%;position:absolute;top:0;left:0;object-fit:contain;background:#000;border-radius:10px;"></video>`;
    }
    modal.style.display = "flex";
}

document.getElementById("close-video").addEventListener("click", () => {
    const modal = document.getElementById("video-modal");
    document.getElementById("video-player-wrapper").innerHTML = "";
    modal.style.display = "none";
});

// Image Modal Handler
function openImageModal(url) {
    const modal = document.getElementById("image-modal");
    document.getElementById("showcase-img").src = url;
    modal.style.display = "flex";
}

document.getElementById("close-image").addEventListener("click", () => {
    document.getElementById("image-modal").style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("video-modal")) {
        document.getElementById("video-modal").style.display = "none";
        document.getElementById("video-player-wrapper").innerHTML = "";
    }
    if (e.target === document.getElementById("image-modal")) {
        document.getElementById("image-modal").style.display = "none";
    }
    if (e.target === document.getElementById("password-modal")) {
        document.getElementById("password-modal").style.display = "none";
    }
});
