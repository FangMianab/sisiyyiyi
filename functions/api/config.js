// 默认配置数据
const defaultConfig = {
  profile: {
    name: "Lana Vice",
    bio: "✨ Adult Creator & Digital Muse | All links direct & unrestricted 💋",
    avatar: "images/avatar.jpg",
    theme: "velvet-ruby",
    fontFamily: "Default"
  },
  links: [
    {
      id: "1",
      title: "🔥 Exclusive VIP Content & Photos",
      url: "https://link.me/@lanavice",
      type: "link",
      icon: "fa-solid fa-fire",
      colorTone: "ruby"
    },
    {
      id: "2",
      title: "🎬 Watch Latest Teaser Video",
      url: "videos/sample.mp4",
      type: "video",
      icon: "fa-solid fa-play-circle",
      colorTone: "magenta"
    },
    {
      id: "3",
      title: "💎 VIP QR Code & Contact",
      url: "images/qr.png",
      type: "image",
      icon: "fa-solid fa-qrcode",
      colorTone: "gold"
    }
  ]
};

// 获取配置（优先读取 KV）
export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (env.BIO_KV) {
      const kvData = await env.BIO_KV.get("site_config", { type: "json" });
      if (kvData) {
        return new Response(JSON.stringify(kvData), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return new Response(JSON.stringify(defaultConfig), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify(defaultConfig), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

// 保存配置到 KV
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const newConfig = await request.json();
    if (env.BIO_KV) {
      await env.BIO_KV.put("site_config", JSON.stringify(newConfig));
      return new Response(JSON.stringify({ success: true, message: "成功保存到 Cloudflare KV 数据库！" }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: "未检测到 BIO_KV 绑定，数据仅暂存内存中。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}