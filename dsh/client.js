// luna-plugin-army 前端：插件页「军团总账」卡片 —— 双 profile 插件全清单。
//
// 手写在 lazy-CJS bundle 协议里（window.__ModuleLoader__.load，factory 返回
// cordis-plugin 导出），零构建零 dsh 包依赖 —— 与 modsearch 的手写形态一致。
//
// 【坑档·boot 门禁】面板 UI 有 HARNESS boot 屏：每个 client 条目必须激活到
// active，任何一个抛异常（fiber FAILED）都会把整页 UI 卡死在
// "web boot: N entry did not activate" 上（v1 就是这么全挂的）。
// 病根两连：① exports.inject 留空数组却直接摸 ctx.slots —— cordis 里访问
// 未声明服务直接抛错，必须 exports.inject = ['slots']（our-free-model 同款）；
// ② 注册的 'plugins.tab' 槽根本不存在（契约清单里只有 plugins.item /
// plugins.bundle.config / settings.plugins.tab...），槽名错只会永远等声明。
//
// 正确姿势（抄官方槽契约文档里的范例）：
//   return { inject: ['slots'], apply(ctx) {
//     ctx.slots.inject('<slot>', () => ctx.slots.register({...}, Component)) } }
//
// 槽选 plugins.item：插件页 Official 组的一张卡（label 是卡标题），点开进入
// 自己的页面 —— 组件收 { view: 'summary' | 'page', form? }：
//   · summary = 卡片上的一句话描述
//   · page    = 点开后的军团总账整页
//
// 数据源是同源 Next API /api/dsh/plugins（鲸鱼娘项目维护的总账）：
//   · 预览域名访问（正常场景）：页面挂在 /dshui/（或老口 /dsh-panel/）前缀下，
//     fetch 用相对路径 /api/dsh/plugins —— 前缀无关，天然同源直达 Next API
//   · 本机直开 127.0.0.1:19841：面板进程没有这个 route → 404 → 显示提示
window.__ModuleLoader__.load({
  id: 'luna-plugin-army',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    var react = require('react')
    var h = react.createElement

    var API = '/api/dsh/plugins'

    function fetchArmy() {
      return fetch(API, { headers: { accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status)
          return r.json()
        })
        .then(function (d) {
          if (!d || d.ok !== true) throw new Error((d && d.note) || 'bad payload')
          return d
        })
    }

    function Card(props) {
      return h(
        'div',
        {
          style: {
            border: '1px solid var(--dsh-border, rgba(128,128,128,.25))',
            borderRadius: 8,
            padding: '10px 12px',
            background: 'var(--dsh-layer, rgba(128,128,128,.06))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'baseline',
          },
        },
        props.children,
      )
    }

    function Badge(props) {
      var color = props.color || 'rgba(128,128,128,.7)'
      return h(
        'span',
        {
          style: {
            fontSize: 11,
            lineHeight: '18px',
            padding: '0 6px',
            borderRadius: 9,
            color: '#fff',
            background: color,
            whiteSpace: 'nowrap',
          },
        },
        props.children,
      )
    }

    function PluginRow(p) {
      var missing = p.row.resolved === null
      return h(
        'div',
        {
          style: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'baseline',
            padding: '6px 0',
            borderBottom: '1px solid var(--dsh-border, rgba(128,128,128,.12))',
            opacity: missing ? 0.55 : 1,
          },
        },
        h('span', { style: { fontWeight: 600, fontSize: 13, wordBreak: 'break-all' } }, p.row.name),
        p.row.version ? h('span', { style: { fontSize: 12, opacity: 0.75 } }, '@' + p.row.version) : null,
        p.row.bundled ? h(Badge, { color: '#2e7d32' }, '已注册') : h(Badge, null, '未注册'),
        missing ? h(Badge, { color: '#c62828' }, '包不在位') : null,
        p.row.desc ? h('span', { style: { fontSize: 12, opacity: 0.7, flexBasis: '100%' } }, p.row.desc) : null,
      )
    }

    function ProfileSection(props) {
      var data = props.data
      if (!data) return null
      var missing = (data.missing || []).length
      return h(
        'div',
        { style: { marginBottom: 20 } },
        h(
          'div',
          { style: { fontWeight: 700, fontSize: 14, margin: '14px 0 4px' } },
          props.title,
          ' · ' + data.count + ' 个',
          missing
            ? h(Badge, { color: '#c62828' }, '缺包 ' + missing + '：' + data.missing.join(', '))
            : null,
        ),
        (data.plugins || []).map(function (row) {
          return h(PluginRow, { key: row.name, row: row })
        }),
      )
    }

    function ArmyPage() {
      var state = react.useState({ loading: true, data: null, error: '' })
      var loading = state[0].loading
      var data = state[0].data
      var error = state[0].error
      var setState = state[1]

      react.useEffect(function () {
        var alive = true
        fetchArmy()
          .then(function (d) {
            if (alive) setState({ loading: false, data: d, error: '' })
          })
          .catch(function (e) {
            if (alive) setState({ loading: false, data: null, error: String(e && e.message ? e.message : e) })
          })
        return function () {
          alive = false
        }
      }, [])

      if (loading) return h('div', { style: { padding: 24, opacity: 0.7 } }, '军团总账载入中…')
      if (error) {
        return h(
          'div',
          { style: { padding: 24 } },
          h('div', { style: { fontWeight: 700, marginBottom: 8 } }, '总账 API 不可达：' + error),
          h(
            'div',
            { style: { fontSize: 13, opacity: 0.75, lineHeight: 1.7 } },
            '数据源是鲸鱼娘项目的 /api/dsh/plugins（需要 dev server 3000 在跑）。',
            '远程预览访问面板时自动可达；本机直开 127.0.0.1:19841 看不到 —— 这不影响面板本体。',
          ),
        )
      }

      return h(
        'div',
        { style: { padding: '16px 20px', maxWidth: 900, margin: '0 auto' } },
        h(
          'div',
          { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 } },
          h(Card, null, '军团合计 ' + data.total + ' 个'),
          h(Card, null, 'headless（鲸鱼娘军团）' + data.headless.count),
          h(Card, null, 'web（本面板）' + data.web.count),
          data.missingTotal
            ? h(Badge, { color: '#c62828' }, '缺包 ' + data.missingTotal + ' 个')
            : h(Badge, { color: '#2e7d32' }, '全部在位'),
        ),
        h(
          'div',
          { style: { fontSize: 12, opacity: 0.65, marginBottom: 6 } },
          '双 profile 是 dsh 的目录设计：headless 是鲸鱼娘驱 dsh 干活的军团，web 服务这个面板 —— 两个清单互不可见是常态，这里是唯一的全量总账。',
        ),
        h(ProfileSection, { title: 'headless · 鲸鱼娘的军团', data: data.headless }),
        h(ProfileSection, { title: 'web · 面板侧', data: data.web }),
      )
    }

    // plugins.item 的条目组件：summary 视图 = 卡片一句话；page 视图 = 总账整页。
    // 宿主还会传 form?: ConfigPageForm（本卡没有可配置项，忽略）。
    function ArmyEntry(props) {
      if (props && props.view === 'summary') {
        return h(
          'span',
          null,
          '双 profile 全量清单：headless + web 两个军团的名字、版本、在位状态一页看全。',
        )
      }
      return h(ArmyPage)
    }

    function apply(ctx) {
      ctx.slots.inject('plugins.item', function* () {
        yield ctx.slots.register(
          { name: 'plugins.item', id: 'luna-plugin-army', order: 10, label: '军团总账' },
          ArmyEntry,
        )
      })
    }

    exports.apply = apply
    exports.inject = ['slots']
    exports.__ArmyPage = ArmyPage
    return module.exports
  },
})
