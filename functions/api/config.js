const defaultConfig = {
  profile: {
    name: "Lana Vice",
    bio: "✨ Adult Creator & Digital Muse | All links direct & unrestricted 💋",
    avatar: "images/avatar.jpg",
    backgroundImage: "images/bg.jpg",
    theme: "velvet-ruby",
    fontFamily: "Default",
    linkPassword: "123456" // 默认私密按钮共享密码
  },
  links: [
    {
      id: "1",
      title: "🔥 Exclusive VIP Content & Photos",
      url: "https://link.me/@lanavice",
      type: "link",
      icon: "fa-solid fa-fire",
      colorTone: "ruby",
      isHidden: false,
      isLocked: false
    },
    {
      id: "2",
      title: "🎬 Watch Latest Teaser Video",
      url: "videos/sample.mp4",
      type: "video",
      icon: "fa-solid fa-play-circle",
      colorTone: "magenta",
      isHidden: false,
      isLocked: true // 示例：这个按钮被上锁了
    },
    {
      id: "3",
      title: "💎 VIP QR Code & Contact",
      url: "images/qr.png",
      type: "image",
      icon: "fa-solid fa-qrcode",
      colorTone: "gold",
      isHidden: false,
      isLocked: false
    }
  ]
};

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

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const newConfig = await request.json();
    if (env.BIO_KV) {
      await env.BIO_KV.put("site_config", JSON.stringify(newConfig));
      return new Response(JSON.stringify({ success: true, message: "成功保存配置！" }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: "未检测到 BIO_KV 绑定。" }), {
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
