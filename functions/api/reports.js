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

    const clientIP = request.headers.get("cf-connecting-ip") || "unknown";
    const ipKey = `report_ip_${clientIP}`;

    if (env.BIO_KV) {
      // 1. 检查同一个 IP 地址在 24 小时内是否已经提交过
      const lastSubmit = await env.BIO_KV.get(ipKey);
      if (lastSubmit) {
        return new Response(JSON.stringify({ success: false, message: "您今天已经提交过反馈，同一个IP 24小时内只能提交1次" }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 2. 以全球统一的 UTC 标准时间（YYYY-MM-DD）计算每天的全局限量（最多5条）
      const utcDate = new Date().toISOString().split('T')[0]; 
      const dailyCountKey = `reports_count_${utcDate}`;
      let currentDailyCount = parseInt(await env.BIO_KV.get(dailyCountKey) || "0");

      if (currentDailyCount >= 5) {
        return new Response(JSON.stringify({ success: false, message: "今天反馈次数已经达到上限，请明日再来" }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 3. 读取现有举报，实施最多 100 条的先进先出（FIFO）淘汰机制
      let reports = await env.BIO_KV.get("site_reports", { type: "json" }) || [];
      const newReport = {
        id: Date.now().toString(),
        reason,
        phone,
        qq,
        time: new Date().toLocaleString()
      };

      reports.unshift(newReport);
      if (reports.length > 100) {
        reports = reports.slice(0, 100); // 超过100条自动删除最早的旧举报
      }

      // 4. 写回 KV 存储
      await env.BIO_KV.put("site_reports", JSON.stringify(reports));
      // 更新当日全局计数（设置 48 小时后自动过期释放空间）
      await env.BIO_KV.put(dailyCountKey, (currentDailyCount + 1).toString(), { expirationTtl: 172800 });
      // 锁定该 IP 24 小时（86400秒）
      await env.BIO_KV.put(ipKey, "submitted", { expirationTtl: 86400 });
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
