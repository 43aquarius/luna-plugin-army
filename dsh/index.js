// luna-plugin-army 服务端：本体无活 —— 军团总账的数据在 Next API（/api/dsh/plugins，
// 鲸鱼娘项目维护），客户端 tab 直接 fetch 同源端点。服务端实体只为满足
// 「插件要挂进 profile」的装载契约（空 apply，零依赖，零副作用）。
export const name = 'luna-plugin-army'
export const inject = []

export function apply() {
  /* 无事可做：军团 tab 的渲染与数据全在 client.js */
}
