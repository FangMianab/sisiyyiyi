export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { username, password } = body;

    const adminUser = env.ADMIN_USER || "admin";
    const adminPass = env.ADMIN_PASS || "lanavice2026";

    if (username === adminUser && password === adminPass) {
      // Generate a simple token or session cookie/flag
      return new Response(JSON.stringify({ success: true, token: "auth_token_verified_ok" }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
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
