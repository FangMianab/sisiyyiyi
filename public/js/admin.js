let currentConfig = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("admin_token");
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }

    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("login-user").value;
        const password = document.getElementById("login-pass").value;
        const errorMsg = document.getElementById("login-error");

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem("admin_token", data.token);
                showDashboard();
            } else {
                errorMsg.textContent = data.message || "登录失败，请检查账号密码";
            }
        } catch (err) {
            errorMsg.textContent = "网络错误或API连接失败";
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("admin_token");
        showLogin();
    });

    document.getElementById("profile-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        currentConfig.profile.name = document.getElementById("cfg-name").value;
        currentConfig.profile.bio = document.getElementById("cfg-bio").value;
        currentConfig.profile.avatar = document.getElementById("cfg-avatar").value;
        currentConfig.profile.backgroundImage = document.getElementById("cfg-bg").value;
        currentConfig.profile.linkPassword = document.getElementById("cfg-password").value;
        currentConfig.profile.theme = document.getElementById("cfg-theme").value;
        
        const fontInput = document.getElementById("cfg-font").value;
        if (fontInput) {
            currentConfig.profile.fontFamily = fontInput;
        }

        await saveConfigToBackend(currentConfig);
        alert("个人资料与访问密码保存成功！");
    });

    document.getElementById("add-btn-trigger").addEventListener("click", () => {
        openBtnModal();
    });

    document.getElementById("cancel-btn-modal").addEventListener("click", () => {
        document.getElementById("btn-modal").style.display = "none";
    });

    document.getElementById("btn-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-btn-id").value;
        const title = document.getElementById("btn-title-input").value;
        const type = document.getElementById("btn-type-input").value;
        const url = document.getElementById("btn-url-input").value;
        const icon = document.getElementById("btn-icon-input").value;
        const colorTone = document.getElementById("btn-color-input").value;
        const isLocked = document.getElementById("btn-locked-input").value === "true";

        if (id) {
            const item = currentConfig.links.find(l => l.id === id);
            if (item) {
                item.title = title;
                item.type = type;
                item.url = url;
                item.icon = icon;
                item.colorTone = colorTone;
                item.isLocked = isLocked;
            }
        } else {
            const newItem = {
                id: Date.now().toString(),
                title,
                type,
                url,
                icon,
                colorTone,
                isHidden: false,
                isLocked
            };
            currentConfig.links.push(newItem);
        }

        await saveConfigToBackend(currentConfig);
        document.getElementById("btn-modal").style.display = "none";
        renderAdminLinks();
    });

    document.getElementById("refresh-reports-btn").addEventListener("click", () => {
        loadReports();
    });
});

async function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard-screen").style.display = "block";
    await loadConfig();
    await loadReports();
}

function showLogin() {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("dashboard-screen").style.display = "none";
}

async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        currentConfig = await res.json();

        document.getElementById("cfg-name").value = currentConfig.profile.name || "sisiyyiyi";
        document.getElementById("cfg-bio").value = currentConfig.profile.bio;
        document.getElementById("cfg-avatar").value = currentConfig.profile.avatar;
        document.getElementById("cfg-bg").value = currentConfig.profile.backgroundImage || "images/bg.jpg";
        document.getElementById("cfg-password").value = currentConfig.profile.linkPassword || "123456";
        document.getElementById("cfg-theme").value = currentConfig.profile.theme || "velvet-ruby";
        document.getElementById("cfg-font").value = currentConfig.profile.fontFamily || "";

        renderAdminLinks();
    } catch (err) {
        console.error("Failed to load config", err);
    }
}

async function loadReports() {
    try {
        const res = await fetch('/api/reports');
        const reports = await res.json();
        renderAdminReports(reports);
    } catch (err) {
        console.error("Failed to load reports", err);
    }
}

function renderAdminReports(reports) {
    const container = document.getElementById("admin-reports-container");
    container.innerHTML = "";

    if (!reports || reports.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:15px;font-size:0.85rem;">暂无收到任何投诉与举报信息</p>`;
        return;
    }

    reports.forEach(report => {
        const card = document.createElement("div");
        card.className = "admin-link-card";
        card.innerHTML = `
            <div class="admin-link-info">
                <div>
                    <div class="admin-link-title" style="color:#ff6b6b;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <span>举报理由：${escapeHtml(report.reason)}</span>
                    </div>
                    <div class="admin-link-url" style="margin-top:6px;">
                        手机：${escapeHtml(report.phone)} &nbsp;|&nbsp; QQ：${escapeHtml(report.qq)}
                    </div>
                    <div style="font-size:0.75rem;color:rgba(208,179,189,0.5);margin-top:4px;">
                        提交时间：${report.time}
                    </div>
                </div>
            </div>
            <div class="admin-link-actions" style="justify-content:flex-end;">
                <button class="btn-icon delete" onclick="deleteReport('${report.id}')">
                    <i class="fa-solid fa-trash-can"></i> 删除并释放空间
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.deleteReport = async function(id) {
    if (confirm("确定要删除这条举报信息吗？")) {
        try {
            const res = await fetch(`/api/reports?id=${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                loadReports();
            } else {
                alert("删除失败: " + data.message);
            }
        } catch (err) {
            alert("请求出错");
        }
    }
};

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function saveConfigToBackend(cfg) {
    try {
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cfg)
        });
        const data = await res.json();
        if (!data.success) {
            alert("保存失败: " + data.message);
        }
    } catch (err) {
        console.error("Error saving config", err);
        alert("保存请求出错");
    }
}

function renderAdminLinks() {
    const container = document.getElementById("admin-links-container");
    container.innerHTML = "";

    if (!currentConfig.links || currentConfig.links.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:20px;">暂无跳转按钮，请点击上方添加</p>`;
        return;
    }

    currentConfig.links.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "admin-link-card";
        const isHidden = item.isHidden === true;
        const isLocked = item.isLocked === true;

        card.innerHTML = `
            <div class="admin-link-info">
                <div>
                    <div class="admin-link-title">
                        <i class="${item.icon || 'fa-solid fa-link'}"></i>
                        <span>${item.title}</span>
                    </div>
                    <div class="admin-link-url">${item.url}</div>
                </div>
                <div class="admin-link-badges">
                    <span class="badge-status ${isHidden ? 'hidden' : 'visible'}">${isHidden ? '已隐藏' : '展示中'}</span>
                    <span class="badge-status ${isLocked ? 'locked' : 'unlocked'}">${isLocked ? '🔒 已上锁' : '🔓 公开'}</span>
                </div>
            </div>
            <div class="admin-link-actions">
                <div class="action-group-left">
                    <button class="btn-icon" title="上移" onclick="moveLinkUp(${index})" ${index === 0 ? 'style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <i class="fa-solid fa-arrow-up"></i> 上移
                    </button>
                    <button class="btn-icon" title="下移" onclick="moveLinkDown(${index})" ${index === currentConfig.links.length - 1 ? 'style="opacity:0.3;cursor:not-allowed;"' : ''}>
                        <i class="fa-solid fa-arrow-down"></i> 下移
                    </button>
                </div>
                <div class="action-group-right">
                    <button class="btn-icon" title="${isHidden ? '点击显示' : '点击隐藏'}" onclick="toggleHide('${item.id}')">
                        <i class="fa-solid ${isHidden ? 'fa-eye-slash' : 'fa-eye'}" style="color:${isHidden ? '#ff6b6b' : '#2ec4b6'}"></i>
                    </button>
                    <button class="btn-icon edit" title="编辑" onclick="editLink('${item.id}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon delete" title="删除" onclick="deleteLink('${item.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.moveLinkUp = async function(index) {
    if (index <= 0) return;
    const links = currentConfig.links;
    const temp = links[index];
    links[index] = links[index - 1];
    links[index - 1] = temp;
    await saveConfigToBackend(currentConfig);
    renderAdminLinks();
};

window.moveLinkDown = async function(index) {
    const links = currentConfig.links;
    if (index >= links.length - 1) return;
    const temp = links[index];
    links[index] = links[index + 1];
    links[index + 1] = temp;
    await saveConfigToBackend(currentConfig);
    renderAdminLinks();
};

window.toggleHide = async function(id) {
    const item = currentConfig.links.find(l => l.id === id);
    if (item) {
        item.isHidden = !item.isHidden;
        await saveConfigToBackend(currentConfig);
        renderAdminLinks();
    }
};

function openLinkModal(item = null) {
    const modal = document.getElementById("btn-modal");
    const titleText = document.getElementById("modal-title-text");
    
    if (item) {
        titleText.textContent = "编辑按钮";
        document.getElementById("edit-btn-id").value = item.id;
        document.getElementById("btn-title-input").value = item.title;
        document.getElementById("btn-type-input").value = item.type;
        document.getElementById("btn-url-input").value = item.url;
        document.getElementById("btn-icon-input").value = item.icon;
        document.getElementById("btn-color-input").value = item.colorTone;
        document.getElementById("btn-locked-input").value = item.isLocked ? "true" : "false";
    } else {
        titleText.textContent = "添加新按钮";
        document.getElementById("edit-btn-id").value = "";
        document.getElementById("btn-form").reset();
        document.getElementById("btn-icon-input").value = "fa-solid fa-fire";
        document.getElementById("btn-locked-input").value = "false";
    }
    modal.style.display = "flex";
}

window.editLink = function(id) {
    const item = currentConfig.links.find(l => l.id === id);
    if (item) openLinkModal(item);
};

window.deleteLink = async function(id) {
    if (confirm("确定要彻底删除这个跳转按钮吗？")) {
        currentConfig.links = currentConfig.links.filter(l => l.id !== id);
        await saveConfigToBackend(currentConfig);
        renderAdminLinks();
    }
};

document.getElementById("add-btn-trigger").addEventListener("click", () => {
    openLinkModal();
});
