from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


HOST = "127.0.0.1"
PORT = 8771
UPSTREAM = "https://api.deepseek.com/chat/completions"
ALLOW_ORIGIN = "http://127.0.0.1:8770"
SYSTEM_TEMPLATE = (
    "你是“田明白”，一个商丘本地小农户农事助手。"
    "当前地块上下文：{field_context}。"
    "要求：用河南大白话、一次只给一条最优先动作、不推荐具体农药剂量、"
    "拿不准让用户打12316。"
)


def error_payload(message: str = "网络或key问题", code: str = "proxy_error"):
    return {
        "error": "网络或key问题",
        "code": code,
        "message": message,
    }


class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "TianMingBaiProxy/1.0"

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json; charset=utf-8")

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._cors()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/chat":
            self._send_json(404, error_payload("接口不存在", "not_found"))
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 64 * 1024:
                raise ValueError("请求体为空或过大")
            request_data = json.loads(self.rfile.read(length).decode("utf-8"))
            user_message = str(request_data.get("user_message", "")).strip()
            field_context = str(request_data.get("field_context", "")).strip()
            if not user_message:
                raise ValueError("缺少 user_message")
            if not field_context:
                field_context = "暂无地块上下文"
        except (ValueError, json.JSONDecodeError) as exc:
            self._send_json(400, error_payload(str(exc), "bad_request"))
            return

        api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
        if not api_key:
            self._send_json(200, error_payload("请配置 DEEPSEEK_API_KEY", "missing_key"))
            return

        upstream_body = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": SYSTEM_TEMPLATE.format(field_context=field_context),
                },
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.3,
            "max_tokens": 500,
        }
        request = urllib.request.Request(
            UPSTREAM,
            data=json.dumps(upstream_body, ensure_ascii=False).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                result = json.loads(response.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"]
            self._send_json(200, {"content": content})
        except (urllib.error.URLError, TimeoutError, KeyError, IndexError, json.JSONDecodeError) as exc:
            self._send_json(200, error_payload(f"DeepSeek 请求失败：{exc}", "upstream_error"))

    def log_message(self, format_string, *args):
        print(f"[proxy] {self.address_string()} {format_string % args}")


if __name__ == "__main__":
    print(f"田明白代理已启动：http://{HOST}:{PORT}")
    print("请通过环境变量 DEEPSEEK_API_KEY 提供密钥。")
    ThreadingHTTPServer((HOST, PORT), ProxyHandler).serve_forever()
