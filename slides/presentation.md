Dưới đây là toàn bộ nội dung file Markdown nguyên vẹn, bạn có thể sao chép trực tiếp để sử dụng:

```markdown
<!--markpress-opt
{
  "autoSplit": false,
  "sanitize": false,
  "title": "Tối ưu hóa OpenClaw"
}
markpress-opt-->

<!--slide-attr x=0 y=0 scale=1.2 -->

# Tối ưu hóa OpenClaw
## Bí quyết giúp AI Agent Rẻ hơn, Nhanh hơn và Thông minh hơn

Chỉ cần tùy chỉnh tệp `openclaw.json`

<!-- SPEAKER NOTES
Chào mừng mọi người. Hôm nay chúng ta sẽ cùng thảo luận về một chủ đề cực kỳ thực tế và "bắt tay vào làm luôn": cách tối ưu hóa một AI agent chạy trên OpenClaw để vừa tiết kiệm chi phí, vừa chạy nhanh hơn mà vẫn đảm bảo độ tin cậy.

Không lý thuyết suông, không nói giảm nói tránh. Sau bài thuyết trình này, bạn sẽ có ngay một file cấu hình openclaw.json hoàn chỉnh để copy-paste và thấy ngay hiệu quả tiết kiệm tiền.

(Tự giới thiệu bản thân ngắn gọn. Chia sẻ một chút về kinh nghiệm vận hành OpenClaw trong môi trường thực tế của bạn).
-->

------

<!--slide-attr x=2000 y=-150 rotate=-2 scale=1.0 -->

# Vấn đề của Agent: "Nghiện" tiêu tiền

- Cứ mỗi tin nhắn mới, hệ thống lại **gửi lại toàn bộ các tin nhắn trước đó**
- Tính năng chạy nền (background check) tự động kích hoạt **mỗi 30 phút một lần**
- Các file trong không gian làm việc (workspace) bị tải lại **ở mỗi lượt chat**

> Đến lượt chat thứ 20, bạn đang phải trả tiền để AI đọc lại từ lượt thứ 1 đến lượt thứ 19.

<!-- SPEAKER NOTES
Đây chính là nguyên nhân cốt lõi của những chiếc hóa đơn API "trên trời" mà bạn không lường trước.

Con AI không chỉ xử lý mỗi tin nhắn mới nhất của bạn — nó phải đọc lại toàn bộ lịch sử cuộc trò chuyện mỗi lần bạn nhấn gửi. Đã thế, tính năng kiểm tra chạy nền (heartbeat) cứ 30 phút lại "thức dậy" một lần, ngay cả lúc 3 giờ sáng khi chẳng có ai dùng.

Hỏi khán giả: "Ở đây có ai từng giật mình khi nhìn thấy hóa đơn API cuối tháng chưa?" (Thường sẽ có vài người giơ tay).

Đây không phải là lỗi — đây là cách các mô hình ngôn ngữ lớn (LLM) hoạt động. Nhưng tin vui là OpenClaw cung cấp cho chúng ta các "nút vặn" để kiểm soát điều đó.
-->

------

<!--slide-attr x=4000 y=150 rotate=2 scale=1.0 -->

# Con số thực tế: Chi phí là bao nhiêu?

| Mô hình (Model) | Chi phí ước tính hàng tháng |
|---|---|
| Claude Opus 4.6 | ~325 USD / tháng |
| Claude Sonnet 4.6 | ~188 USD / tháng |
| Gemini 2.5 Flash | ~24 USD / tháng |
| GPT-OSS-120B | ~2 USD / tháng |

**Phần lớn số tiền đó là chi phí vận hành thừa thãi, chứ không phải chi phí xử lý công việc thực tế.**

<!-- SPEAKER NOTES
Những con số này được lấy từ dữ liệu sử dụng thực tế của một lập trình viên làm việc hàng ngày.

Chỉ riêng tính năng chạy nền (heartbeat) — những lượt kiểm tra ngầm đó — đã ngốn khoảng 30 đến 100 USD mỗi tháng trên các mô hình cao cấp (flagship).

Tin tốt là: hầu hết các chi phí thừa thãi này đều có thể cấu hình lại được. Bạn hoàn toàn có thể cắt giảm từ 60% đến 80% chi phí thực tế bằng các thiết lập mà chúng ta sắp bàn tới, mà không hề làm giảm chất lượng phản hồi của AI.

Hãy nhìn vào dòng GPT-OSS-120B — đây là mức chi phí lý tưởng khi bạn biết cách định tuyến (routing) và tối ưu hóa thông minh.
-->

------

<!--slide-attr x=6000 y=-100 rotate=-1 scale=1.1 -->

# `openclaw.json` — Bảng điều khiển của bạn

Chỉ một file duy nhất tại đường dẫn `~/.openclaw/openclaw.json`

```json
{
  "agents": {
    "defaults": {
      "..."
    }
  }
}

```

Thay đổi vài dòng tại đây. **Cắt giảm 60–80% chi phí.** Không cần sửa một dòng code nào.

> Tất cả các cấu hình được chia sẻ hôm nay đều nằm gọn trong file này.

---

# 1. Hạn mức ngữ cảnh (Context Budget)

> AI sẽ được "nhồi" những gì vào bộ nhớ ở mỗi lượt chat?

Mỗi ký tự trong các file dự án của bạn = tokens = tiền.

Các thiết lập này giúp bạn kiểm soát **dung lượng của gói dữ liệu đó**.

---

# Hạn chế lặp bối cảnh (Skip Re-Injection)

> Giống như việc bắt nhân viên đọc lại toàn bộ nội quy trước khi trả lời một tin nhắn trên Zalo. Một lần đọc là đủ rồi!

```json
{
  "contextInjection": "continuation-skip",
  "bootstrapMaxChars": 12000,
  "bootstrapTotalMaxChars": 60000
}

```

Trong một phiên chat 20 lượt: lượt thứ 18 sẽ không nạp lại ngữ cảnh giống nhau.

[agents.defaults.contextInjection](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextinjection)

---

# Dọn dẹp kết quả chạy tool (Prune Old Tool Results)

> Đọc xong tài liệu nào thì cất hoặc hủy đi, đừng để chúng chất đống bừa bộn trên bàn làm việc.

```json
{
  "contextPruning": {
    "mode": "cache-ttl",
    "ttl": "1h"
  }
}

```

Loại bỏ đầu ra, đầu vào của các công cụ đã chạy trước đó, giúp giảm ngữ cảnh thừa thãi.

[agents.defaults.contextPruning](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextpruning)

---

# 2. Bộ nhớ & Trạng thái (Memory & State)

> Agent sẽ nhớ được những gì giữa các phiên làm việc?

Không có bộ nhớ tốt: AI quên bạn là ai ở mỗi lần chạy.

Có bộ nhớ tốt: AI sẽ tiếp tục công việc ngay lập tức.

---

# Lưu lại trước khi quên (Save Before You Forget)

> Ghi chép nhanh trước khi cuộc họp kết thúc.

```json
{
  "compaction": {
    "memoryFlush": {
      "enabled": true,
      "model": "ollama/qwen3:8b",
      "prompt": "Write lasting notes to memory/YYYY-MM-DD.md. Reply NO_REPLY if nothing to store."
    }
  }
}

```

Ghi nhớ mỗi khi session kết thúc, nên sử dụng **mô hình local miễn phí**, để giảm thiểu chi phí tới mức thấp nhất.

[compaction.memoryFlush](https://docs.openclaw.ai/gateway/configuration)

---

# Tìm kiếm bộ nhớ thông minh hơn

> Sự khác biệt giữa việc bấm `Ctrl+F` tìm từ khóa và tìm bằng ngôn ngữ tự nhiên .

```json
{
  "memorySearch": {
    "provider": "openai"
  }
}

```

Kích hoạt **tìm kiếm kết hợp (hybrid search)**: khớp từ khóa + tìm kiếm ngữ nghĩa (vector similarity).

Tăng hiệu quả tìm kiếm bằng ngôn ngữ tự nhiên, giúp AI tăng độ chính xác khi tìm kiếm nội dung.

[agents.defaults.memorySearch](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-memorysearch)

---

# 3. Định tuyến mô hình (Model Routing)

> Chọn mặt gửi vàng: Việc nào thì đi với mô hình đó.

Không phải việc gì cũng cần đến mô hình đắt tiền nhất.

Định tuyến thông minh giúp bạn chọn đúng công cụ cho đúng việc, với mức giá hợp lý nhất.

---

# Cache câu lệnh hệ thống (System Prompt)

> Nội quy công ty chỉ được hướng dẫn một lần.

```json
{
  "params": {
    "cacheRetention": "long"
  }
}

```

**Giảm tới 90% chi phí** cho các token đã được cache khi dùng Anthropic.

Hoạt động theo từng model và từng agent. Có 3 cấp độ: `none`, `short`, `long`.

[agents.defaults.params.cacheRetention](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-params-cacheretention)

---

# Luôn luôn có phương án B

> Nếu quán ăn yêu thích của bạn hết bàn, bạn đã có sẵn danh sách các quán thay thế xếp theo thứ tự ưu tiên.

```json
{
  "model": {
    "primary": "anthropic/claude-opus-4-6",
    "fallbacks": [
      "anthropic/claude-sonnet-4-6",
      "google/gemini-2.5-flash"
    ]
  }
}

```

Tự động chuyển đổi khi gặp lỗi giới hạn tần suất (rate-limit), quá tải (overload), hoặc mất kết nối.

[agents.defaults.model.fallbacks](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-model-fallbacks)

---

# 4. Lên lịch chạy nền (Heartbeat Scheduling)

> Agent sẽ làm gì khi không có ai trò chuyện với nó?

Mặc định: Cứ 30 phút lại thức dậy một lần để chạy các chu kỳ kiểm tra đắt đỏ, kể cả lúc 3 giờ sáng, kể cả khi chẳng có việc gì để làm.

---

# Thức dậy một cách thông minh

> Chỉ đặt báo thức vào ngày đi làm, chứ không đặt chuông vô tội vạ mỗi 30 phút cả ngày lẫn đêm.

```json
{
  "heartbeat": {
    "every": "55m",
    "lightContext": true,
    "isolatedSession": true,
    "skipWhenBusy": true,
    "activeHours": { "start": "08:00", "end": "22:00" },
    "model": "ollama/llama3.2:1b"
  }
}

```

Chỉ riêng dòng `isolatedSession: true`: **Giảm từ ~100K tokens xuống còn ~2–5K tokens mỗi lượt.**

[agents.defaults.heartbeat](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-heartbeat)

---

# Chỉ trả tiền khi thực sự có việc

> Một danh sách kiểm tra giúp Agent tự hiểu: "Hôm nay không có việc gì đâu, đi ngủ tiếp đi thôi."

```yaml
<!-- HEARTBEAT.md -->
tasks:
  - id: inbox-check
    interval: 1h
    prompt: "Check inbox. Reply HEARTBEAT_OK if nothing urgent."
  - id: memory-consolidate
    interval: 12h
    prompt: "Summarize memory files into MEMORY.md."
  - id: weekly-review
    interval: 7d
    prompt: "Write weekly review to memory/weekly-YYYY-MM-DD.md."

```

**Chi phí token bằng 0** khi không có task nào đến hạn.

[HEARTBEAT.md task scheduling](https://docs.openclaw.ai/gateway/configuration)

---

# File `openclaw.json` hoàn chỉnh cho bạn

```json
{
  "agents": {
    "defaults": {
      "contextInjection": "continuation-skip",
      "bootstrapMaxChars": 12000,
      "bootstrapTotalMaxChars": 60000,
      "contextPruning": { "mode": "cache-ttl", "ttl": "1h" },
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-oss-120b", "google/gemini-2.5-flash"]
      },
      "params": { "cacheRetention": "long" },
      "heartbeat": {
        "every": "55m", "lightContext": true,
        "isolatedSession": true, "skipWhenBusy": true,
        "activeHours": { "start": "08:00", "end": "22:00" },
        "model": "ollama/llama3.2:1b"
      },
      "compaction": {
        "memoryFlush": {
          "enabled": true,
          "model": "ollama/qwen3:8b",
          "prompt": "Write lasting notes to memory/YYYY-MM-DD.md. Reply NO_REPLY if nothing to store."
        }
      },
      "memorySearch": { "provider": "openai" }
    }
  }
}

```

---

# Cách áp dụng ngay lập tức

1. Mở khung chat với agent của bạn lên
2. Paste đoạn config phía trên vào
3. Ra lệnh: `"Cập nhật file openclaw.json của tôi với cấu hình này nhé"`

Agent sẽ tự động áp dụng các thay đổi và tự khởi động lại hệ thống.

> Không cần mở terminal, không cần tự tay sửa file JSON, không cần gõ lệnh restart thủ công.

---

# Cải tiến liên tục

```
Quan sát → Ghi nhận → Cải tiến → Lặp lại

```

* **Quan sát:** Kiểm tra bảng phân bổ chi phí API hàng tháng của bạn
* **Ghi nhận:** Xem tác vụ nào đang ngốn nhiều tiền nhất
* **Cải tiến:** Tinh chỉnh từng thông số một, rồi đo lường sự thay đổi
* **Lặp lại:** Tối ưu hóa sản phẩm là một thói quen lâu dài, không phải chuyện làm một lần là xong

> Cấu hình ngày hôm nay là một bệ phóng tốt, chứ không phải là điểm dừng chân cuối cùng.

---

# Xin cảm ơn mọi người

Mọi người có câu hỏi gì không ạ?

Hoặc nếu muốn giao lưu kết nối?

Cứ thoải mái liên hệ với mình qua:

[https://github.com/vanduc2514](https://github.com/vanduc2514)

