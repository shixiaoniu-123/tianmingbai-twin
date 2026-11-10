# 田明白 · 我的农田数字孪生

面向河南商丘小农户的 AI 农事决策助手 Web 原型：单页三栏农事工作台，左侧给判断，中间给三维地块，右侧给体检与分区。

## 在线预览

GitHub Pages 地址：https://shixiaoniu-123.github.io/tianmingbai-twin/

（Pages 首次开启后约 1-2 分钟生效）

## 文件说明

| 文件 | 说明 |
| --- | --- |
| index.html | 单页三栏农事工作台入口 |
| v2.css | 视觉样式 |
| v2.js | 三维地块、天气联动与交互逻辑，three.js 通过 CDN 加载 |
| server_proxy.py | 可选：AI 农事问答后端代理，密钥读环境变量 DEEPSEEK_API_KEY |
| package.json | 依赖声明（three 0.180.0） |

## 本地运行

1. 用任意静态服务器打开 index.html 即可，例如 python -m http.server 8000
2. 需要 AI 问答时，先设置环境变量 DEEPSEEK_API_KEY，再运行 python server_proxy.py

## 说明

业务示意 · 非实时遥感数据；判断依据为公开农技经验与本地规则，不构成处方。
