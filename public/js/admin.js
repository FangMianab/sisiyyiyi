let currentConfig = null;

document.addEventListener("DOMContentLoaded", async () => {
    // Check if logged in
    const token = localStorage.getItem("admin_token");
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }

    // Login Form Handler
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

    // Logout Handler
    document.getElementById("logout-btn").addEventListener("click", () => {
        localStorage.removeItem("admin_token");
        showLogin();
    });

    // Profile Save Handler
    document.getElementById("profile-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        currentConfig.profile.name = document.getElementById("cfg-name").value;
        currentConfig.profile.bio = document.getElementById("cfg-bio").value;
        currentConfig.profile.avatar = document.getElementById("cfg-avatar").value;
        currentConfig.profile.theme = document.getElementById("cfg-theme").value;
        
        const fontInput = document.getElementById("cfg-font").value;
        if (fontInput) {
            currentConfig.profile.fontFamily = fontInput;
        }

        await saveConfigToBackend(currentConfig);
        alert("个人资料保存成功！");
    });

    // Add Button Modal Trigger
    document.getElementById("add-btn-trigger").addEventListener("click", () => {
        openBtnModal();
    });

    document.getElementById("cancel-btn-modal").addEventListener("click", () => {
        document.getElementById("btn-modal").style.display = "none";
    });

    // Save Link/Button Form Handler
    document.getElementById("btn-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("edit-btn-id").value;
        const title = document.getElementById("btn-title-input").value;
        const type = document.getElementById("btn-type-input").value;
        const url = document.getElementById("btn-url-input").value;
        const icon = document.getElementById("btn-icon-input").value;
        const colorTone = document.getElementById("btn-color-input").value;

        if (id) {
            // Edit existing
            const item = currentConfig.links.find(l => l.id === id);
            if (item) {
                item.title = title;
                item.type = type;
                item.url = url;
                item.icon = icon;
                item.colorTone = colorTone;
            }
        } else {
            // Add new
            const newItem = {
                id: Date.now().toString(),
                title,
                type,
                url,
                icon,
                colorTone
            };
            currentConfig.links.push(newItem);
        }

        await saveConfigToBackend(currentConfig);
        document.getElementById("btn-modal").style.display = "none";
        renderAdminLinks();
    });
});

async function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard-screen").style.display = "block";
    await loadConfig();
}

function showLogin() {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("dashboard-screen").style.display = "none";
}

async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        currentConfig = await res.json();

        document.getElementById("cfg-name").value = currentConfig.profile.name;
        document.getElementById("cfg-bio").value = currentConfig.profile.bio;
        document.getElementById("cfg-avatar").value = currentConfig.profile.avatar;
        document.getElementById("cfg-theme").value = currentConfig.profile.theme || "velvet-ruby";
        document.getElementById("cfg-font").value = currentConfig.profile.fontFamily || "";

        renderAdminLinks();
    } catch (err) {
        console.error("Failed to load config", err);
    }
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
    const tbody = document.getElementById("admin-links-tbody");
    tbody.innerHTML = "";

    currentConfig.links.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><i class="${item.icon}"></i> ${item.title}</td>
            <td><span class="badge ${item.type}">${item.type}</span></td>
            <td><small style="color:var(--text-secondary);">${item.url}</small></td>
            <td>${item.colorTone}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="editLink('${item.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon delete" onclick="deleteLink('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

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
    } else {
        titleText.textContent = "添加新按钮";
        document.getElementById("edit-btn-id").value = "";
        document.getElementById("btn-form").reset();
        document.getElementById("btn-icon-input").value = "fa-solid fa-heart";
    }
    modal.style.display = "flex";
}

window.editLink = function(id) {
    const item = currentConfig.links.find(l => l.id === id);
    if (item) openLinkModal(item);
};

window.deleteLink = async function(id) {
    if (confirm("确定要删除这个跳转按钮吗？")) {
        currentConfig.links = currentConfig.links.filter(l => l.id !== id);
        await saveConfigToBackend(currentConfig);
        renderAdminLinks();
    }
};

document.getElementById("add-btn-trigger").addEventListener("click", () => {
    openLinkModal();
});
