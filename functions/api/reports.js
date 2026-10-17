export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (env.BIO_KV) {
      const reports = await env.BIO_KV.get("site_reports", { type: "json" });
      return new Response(JSON.stringify(reports || []), {
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { reason, phone, qq } = body;
    if (!reason || !phone || !qq) {
      return new Response(JSON.stringify({ success: false, message: "所有举报字段均为必填项" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let reports = [];
    if (env.BIO_KV) {
      const existing = await env.BIO_KV.get("site_reports", { type: "json" });
      if (existing) reports = existing;
    }

    const newReport = {
      id: Date.now().toString(),
      reason,
      phone,
      qq,
      time: new Date().toLocaleString()
    };

    reports.unshift(newReport); // 最新提交的排在最前

    if (env.BIO_KV) {
      await env.BIO_KV.put("site_reports", JSON.stringify(reports));
    }

    return new Response(JSON.stringify({ success: true, message: "举报提交成功" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!env.BIO_KV) {
      return new Response(JSON.stringify({ success: false, message: "未配置 KV" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let reports = await env.BIO_KV.get("site_reports", { type: "json" }) || [];
    reports = reports.filter(r => r.id !== id);
    await env.BIO_KV.put("site_reports", JSON.stringify(reports));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}