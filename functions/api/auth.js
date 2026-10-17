export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // 获取客户端IP用于防暴力破解追踪
    const clientIP = request.headers.get("cf-connecting-ip") || "unknown";
    const lockKey = `lockout_${clientIP}`;
    const attemptsKey = `attempts_${clientIP}`;

    // 1. 检查当前IP是否处于锁定状态
    if (env.BIO_KV) {
      const lockoutData = await env.BIO_KV.get(lockKey, { type: "json" });
      if (lockoutData && lockoutData.lockedUntil > Date.now()) {
        const remainingMinutes = Math.ceil((lockoutData.lockedUntil - Date.now()) / 60000);
        return new Response(JSON.stringify({ 
          success: false, 
          message: `密码连续输错次数过多，已被安全锁定，请在 ${remainingMinutes} 分钟后重试` 
        }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    const adminUser = env.ADMIN_USER || "admin";
    const adminPass = env.ADMIN_PASS || "lanavice2026";

    if (username === adminUser && password === adminPass) {
      // 登录成功，清除该IP的错误记录与锁定状态
      if (env.BIO_KV) {
        await env.BIO_KV.delete(attemptsKey);
        await env.BIO_KV.delete(lockKey);
      }
      return new Response(JSON.stringify({ success: true, token: "admin_logged_in_token_xyz" }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // 密码错误，累计失败次数
      if (env.BIO_KV) {
        let attempts = parseInt(await env.BIO_KV.get(attemptsKey) || "0") + 1;
        if (attempts >= 10) {
          // 达到10次错误，锁定10分钟 (600秒 TTL)
          const lockedUntil = Date.now() + 10 * 60 * 1000;
          await env.BIO_KV.put(lockKey, JSON.stringify({ lockedUntil }), { expirationTtl: 600 });
          await env.BIO_KV.delete(attemptsKey);
          return new Response(JSON.stringify({ 
            success: false, 
            message: "连续输错密码达到 10 次，后台已被安全锁定 10 分钟" 
          }), {
            status: 429,
            headers: { "Content-Type": "application/json" }
          });
        } else {
          await env.BIO_KV.put(attemptsKey, attempts.toString(), { expirationTtl: 600 });
          const remaining = 10 - attempts;
          return new Response(JSON.stringify({ 
            success: false, 
            message: `账号或密码错误，您还有 ${remaining} 次尝试机会` 
          }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
      return new Response(JSON.stringify({ success: false, message: "账号或密码错误" }), {
        status: 401,
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
