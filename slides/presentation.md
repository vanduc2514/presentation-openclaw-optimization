<!--markpress-opt
{
  "autoSplit": false,
  "sanitize": false,
  "title": "Tối ưu OpenClaw"
}
markpress-opt-->

<!--slide-attr x=0 y=0 scale=1.2 -->

# Tối ưu OpenClaw
## Giúp AI agent của bạn rẻ hơn, nhanh hơn và thông minh hơn

Chỉ với `openclaw.json`

<!-- SPEAKER NOTES
Xin chào mọi người. Hôm nay chúng ta sẽ nói về một chủ đề rất thực tế và có thể áp dụng ngay: tối ưu một AI agent chạy trên OpenClaw để giảm chi phí, chạy nhanh hơn và vẫn giữ được độ ổn định.

Không lý thuyết lan man, không nói chung chung. Sau buổi này, mọi người sẽ có một cấu hình openclaw.json có thể copy-paste ngay để tiết kiệm chi phí thật sự.

Giới thiệu ngắn về bản thân. Nhắc tới kinh nghiệm vận hành OpenClaw trong môi trường production.
-->

------

<!--slide-attr x=2000 y=-150 rotate=-2 scale=1.0 -->

# Agent đang có vấn đề về chi tiêu

- Mỗi tin nhắn đều **gửi lại toàn bộ các tin nhắn trước đó**
- Kiểm tra nền mặc định chạy mỗi **30 phút**
- File trong workspace được nạp lại ở **mọi lượt hội thoại**

> Tới lượt thứ 20, bạn vẫn đang trả tiền lại cho các lượt 1 đến 19.

<!-- SPEAKER NOTES
Đây là gốc rễ của gần như mọi hóa đơn tăng bất ngờ.

Agent không chỉ xử lý tin nhắn mới nhất của bạn — nó xử lý lại toàn bộ lịch sử hội thoại ở mỗi lượt. Chưa hết, heartbeat nền còn chạy mỗi 30 phút, kể cả lúc 3 giờ sáng khi không ai dùng.

Có thể hỏi khán giả: “Tháng này có ai bị bất ngờ vì hóa đơn API không?” Thường sẽ có vài người giơ tay.

Đây không phải bug — đó là cách LLM hoạt động. Nhưng OpenClaw cho chúng ta các nút chỉnh để kiểm soát chuyện này.
-->

------

<!--slide-attr x=4000 y=150 rotate=2 scale=1.0 -->

# Chi phí thực tế là bao nhiêu?

| Model | Ước tính chi phí mỗi tháng |
|---|---|
| Claude Opus 4.6 | ~$325 / tháng |
| Claude Sonnet 4.6 | ~$188 / tháng |
| Gemini 2.5 Flash | ~$24 / tháng |
| GPT-OSS-120B | ~$2 / tháng |

**Phần lớn khoản này là chi phí phát sinh, không phải công việc thực sự.**

<!-- SPEAKER NOTES
Các con số này lấy từ mô hình sử dụng thực tế của một developer làm việc hằng ngày.

Riêng heartbeat — tức các lần kiểm tra nền — đã tiêu tốn khoảng $30 đến $100 mỗi tháng nếu dùng các model đầu bảng.

Tin vui là gần như toàn bộ phần overhead này đều cấu hình được. Thực tế, bạn có thể cắt 60 đến 80 phần trăm chi phí với các thiết lập hôm nay mà không làm giảm chất lượng.

Chỉ vào dòng GPT-OSS-120B — đó là mức chi phí bạn có thể hạ xuống nhờ routing và tối ưu hợp lý.
-->

------

<!--slide-attr x=6000 y=-100 rotate=-1 scale=1.1 -->

# `openclaw.json` — bảng điều khiển của bạn

Một file tại `~/.openclaw/openclaw.json`

```json
{
  "agents": {
    "defaults": {
      "..."
    }
  }
}
```

Chỉ cần đổi vài cấu hình ở đây. **Cắt 60–80% chi phí.** Không cần sửa code.

> Toàn bộ cấu hình hôm nay đều nằm trong đúng một file này.

<!-- SPEAKER NOTES
Đây là thông điệp quan trọng nhất: mọi thứ chúng ta sắp nói tới đều nằm trong một file JSON trên máy của bạn.

Không cần sửa code, không cần deploy lại, không cần hạ tầng phức tạp. Bạn chỉnh một file rồi khởi động lại OpenClaw.

Chúng ta sẽ đi qua 8 cấu hình thuộc 4 nhóm. Cuối bài tôi sẽ đưa luôn cấu hình hoàn chỉnh để mọi người copy-paste trực tiếp.
-->

------

<!--slide-attr x=6000 y=1800 rotate=3 scale=1.0 -->

# Ngân sách context

> Mỗi lượt, AI mang những gì vào bộ nhớ làm việc?

Mỗi ký tự trong file workspace = token = tiền.

Những thiết lập này kiểm soát **kích thước gói dữ liệu đó**.

<!-- SPEAKER NOTES
Hãy hình dung mỗi lượt AI là một kiện hàng được gửi đi. Nhóm này quyết định trong kiện hàng đó có gì.

Mặc định, OpenClaw nhét toàn bộ file workspace vào ở mọi lượt. Chúng ta có thể đổi điều đó.

Hai thiết lập quan trọng ở đây: bỏ nạp lại ở các lượt tiếp theo, và dọn bớt kết quả tool cũ sau một khoảng thời gian.
-->

------

<!--slide-attr x=4000 y=1650 rotate=-2 scale=1.0 -->

# Bỏ nạp lại nội dung đã có

> Giống như đọc lại sổ tay công ty trước mọi tin nhắn Slack. Một lần là đủ.

```json
{
  "contextInjection": "continuation-skip",
  "bootstrapMaxChars": 12000,
  "bootstrapTotalMaxChars": 60000
}
```

Trong một phiên 20 lượt: loại bỏ chi phí re-injection ở khoảng 18 lượt.

[agents.defaults.contextInjection](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextinjection)

<!-- SPEAKER NOTES
contextInjection quyết định khi nào các file bootstrap trong workspace — như SOUL.md, AGENTS.md và các file tương tự — được chèn vào system prompt.

Giá trị mặc định là "always", nghĩa là mọi lượt tiếp diễn đều phải trả lại toàn bộ chi phí token của phần bootstrap.

"continuation-skip" mới là lựa chọn nên dùng. Nó bỏ qua re-injection ở các lượt follow-up an toàn, nhưng vẫn dựng lại đầy đủ ở heartbeat và sau compaction — nên không mất gì quan trọng.

Các giới hạn ký tự là hàng rào an toàn: nếu ai đó lỡ viết một file AGENTS.md quá lớn thì cũng không làm nổ ngân sách context.

Tác động là rất lớn: với một cuộc hội thoại 20 lượt và khoảng 10.000 token từ file workspace, bạn loại được re-injection ở cỡ 18 trên 20 lượt.
-->

------

<!--slide-attr x=2000 y=1950 rotate=2 scale=1.0 -->

# Dọn kết quả cũ

> Đọc xong thì lưu hồ sơ hoặc hủy giấy tờ, đừng để chất đống trên bàn làm việc.

```json
{
  "contextPruning": {
    "mode": "cache-ttl",
    "ttl": "1h"
  }
}
```

Giữ context gọn trong các phiên kéo dài nhiều giờ.

[agents.defaults.contextPruning](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextpruning)

<!-- SPEAKER NOTES
Khi agent đọc file, duyệt web hay chạy lệnh shell, toàn bộ đầu ra sẽ được lưu vào lịch sử hội thoại.

Sau một thời gian — đặc biệt ở các phiên dài — những kết quả đó đã cũ. Bạn đã xử lý xong rồi. Nhưng chúng vẫn chiếm chỗ trong mọi lần gọi API tiếp theo.

contextPruning dọn chúng ngay trong bộ nhớ trước mỗi lần gọi LLM. Nó không đụng tới transcript trên đĩa, nên không có gì bị mất vĩnh viễn.

Quy trình là: chờ TTL hết hạn, cắt mềm các kết quả quá lớn (giữ đầu và cuối, chèn "..."), rồi xóa cứng phần còn lại bằng một placeholder.

Với TTL là 1 giờ, mọi kết quả tool cũ hơn 1 giờ sẽ được tự động dọn.
-->

------

<!--slide-attr x=0 y=1800 rotate=-3 scale=1.0 -->

# Bộ nhớ & trạng thái

> Agent sẽ nhớ gì giữa các phiên làm việc?

Nếu memory kém: lần nào agent cũng phải tự tìm lại từ đầu.

Nếu memory tốt: nó tiếp tục đúng từ điểm đang dang dở.

<!-- SPEAKER NOTES
Nhóm này tập trung vào việc giữ lại những gì thật sự quan trọng.

Có hai tình huống then chốt: khi cửa sổ context đầy và bị tóm tắt lại (compaction), và khi agent cần tìm lại thứ đã lưu trong memory.
-->

------

<!--slide-attr x=0 y=3600 rotate=2 scale=1.0 -->

# Lưu lại trước khi quên

> Ghi chú trước khi cuộc họp kết thúc, trước khi ai đó xóa mất bảng trắng.

```json
{
  "compaction": {
    "memoryFlush": {
      "enabled": true,
      "model": "ollama/qwen3:8b",
      "prompt": "Ghi các ghi chú bền vững vào memory/YYYY-MM-DD.md. Trả lời NO_REPLY nếu không có gì cần lưu."
    }
  }
}
```

Dùng **model local miễn phí**, chi phí $0.

[compaction.memoryFlush](https://docs.openclaw.ai/gateway/configuration)

<!-- SPEAKER NOTES
Compaction tự động xảy ra khi cửa sổ context tiến gần giới hạn. OpenClaw sẽ tóm tắt mọi thứ thành dạng cô đọng rồi tiếp tục.

Vấn đề là: các chi tiết quan trọng có thể biến mất trong quá trình tóm tắt đó. Quyết định quan trọng, việc đang mở, trạng thái hiện tại của dự án — tất cả có thể trôi mất.

memoryFlush kích hoạt một lượt agent chạy ngầm ngay trước compaction. Nhiệm vụ duy nhất của nó là ghi lại các ghi chú bền vững ra file trên đĩa.

Điểm hay là bạn có thể trỏ nó sang một model local miễn phí như Qwen 3 8B chạy qua Ollama. Đây chỉ là tác vụ ghi chép — không cần quá thông minh, chỉ cần ổn định. Chi phí API bằng 0.

Cần OpenClaw v2026.2.23 trở lên để có các bản vá lỗi compaction.
-->

------

<!--slide-attr x=2000 y=3450 rotate=-2 scale=1.0 -->

# Gọi lại memory thông minh hơn

> Khác biệt giữa `Ctrl+F` và một thủ thư hiểu ngữ cảnh.

```json
{
  "memorySearch": {
    "provider": "openai"
  }
}
```

Bật **hybrid search**: khớp từ khóa + độ tương đồng vector.

Tự nhận diện OpenAI API key của bạn. Lập chỉ mục toàn bộ file `memory/*.md`.

[agents.defaults.memorySearch](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-memorysearch)

<!-- SPEAKER NOTES
OpenClaw có sẵn engine memory dùng SQLite. Mặc định nó dùng tìm kiếm từ khóa FTS5 — nhanh nhưng quá sát mặt chữ.

Khi có provider phù hợp, bạn sẽ có hybrid search: FTS5 cho khớp chính xác cộng với vector embedding để tìm theo ngữ nghĩa.

Ví dụ thực tế: bạn đã lưu một ghi chú về "giới hạn tốc độ API" từ ba tháng trước. Sau này bạn hỏi về "vì sao request bị throttle". Tìm kiếm từ khóa có thể bỏ lỡ, hybrid search sẽ tìm ra.

Model embedding mặc định là text-embedding-3-small — rất rẻ, khoảng $0.00002 cho mỗi 1.000 token.

Thiết lập này tự phát hiện API key. Nếu bạn đã cấu hình OpenAI sẵn rồi, nó hoạt động ngay.
-->

------

<!--slide-attr x=4000 y=3750 rotate=3 scale=1.0 -->

# Điều phối model

> Tác vụ nào nên chạy bằng model nào?

Không phải việc gì cũng cần model đắt nhất.

Điều phối thông minh là dùng đúng công cụ cho đúng việc — và đúng mức giá.

<!-- SPEAKER NOTES
Ý quan trọng ở đây là: rất có thể bạn đang dùng một model đầu bảng đắt tiền cho mọi thứ, kể cả các kiểm tra nền đơn giản mà model rẻ hơn hoặc miễn phí vẫn làm tốt.

Nhóm này có hai thiết lập: prompt caching để tránh xử lý đi xử lý lại, và chuỗi fallback để tự động dùng model rẻ hơn khi model chính bị quá tải.
-->

------

<!--slide-attr x=6000 y=3600 rotate=-2 scale=1.0 -->

# Lưu cache cho system prompt

> Giáo viên chỉ đọc nội quy lớp một lần, không đọc lại trước mỗi câu hỏi của từng học sinh.

```json
{
  "params": {
    "cacheRetention": "long"
  }
}
```

**Giảm tới 90%** chi phí token đã cache với Anthropic.

Áp dụng theo từng model và từng agent. Có 3 mức: `none`, `short`, `long`.

[agents.defaults.params.cacheRetention](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-params-cacheretention)

<!-- SPEAKER NOTES
Prompt caching là tính năng ở phía provider, và OpenClaw đưa nó thành một khóa cấu hình hạng nhất.

Khi bạn đặt cacheRetention là "long", OpenClaw sẽ yêu cầu provider giữ system prompt của bạn trong cache. Các lượt tiếp theo có cùng tiền tố sẽ chỉ trả một phần nhỏ giá token đầu vào thông thường.

Anthropic giảm tới 90% cho token đã cache. Với system prompt 10.000 token được gửi lại 50 lần mỗi ngày, khoản tiết kiệm là rất đáng kể.

Bạn có thể override cấu hình này theo từng model hoặc từng agent. Ví dụ: tắt với những agent mà system prompt thay đổi ở mọi lượt chạy — như một agent cảnh báo động.

Thứ tự merge cấu hình là: defaults → override theo model → override theo agent.
-->

------

<!--slide-attr x=6000 y=5400 rotate=2 scale=1.0 -->

# Luôn có phương án dự phòng

> Nếu quán ăn bạn thích hết chỗ, bạn đã có sẵn danh sách thay thế theo thứ tự ưu tiên.

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

Tự động xoay vòng khi gặp lỗi rate-limit, quá tải hoặc không khả dụng.

[agents.defaults.model.fallbacks](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-model-fallbacks)

<!-- SPEAKER NOTES
Thiết lập này phục vụ hai mục tiêu: độ tin cậy và chi phí.

Về độ tin cậy: khi model đầu bảng bị quá tải — chuyện rất hay xảy ra vào giờ cao điểm — OpenClaw sẽ tự động rơi xuống model tiếp theo trong chuỗi. Không lỗi, không gián đoạn, không cần thao tác tay.

Về chi phí: hãy đặt các model rẻ hơn ở cuối chuỗi fallback. Những tác vụ nền chạy vào giờ thấp điểm mà bị chuyển sang fallback sẽ rẻ hơn đáng kể so với model chính.

Một điểm cần lưu ý: cơ chế này áp dụng cho cấu hình mặc định. Nếu người dùng tự chọn model bằng lệnh /model thì fallback sẽ không được áp dụng — như vậy sẽ giữ đúng ý định của người dùng.

Auto fallback được đánh dấu bằng modelOverrideSource là "auto" để bạn xem trong log model nào đã thực sự chạy.
-->

------

<!--slide-attr x=4000 y=5250 rotate=-3 scale=1.0 -->

# Lập lịch heartbeat

> Khi không ai nói chuyện với agent, nó đang làm gì?

Mặc định: cứ 30 phút lại thức dậy và chạy các kiểm tra tốn kém, kể cả lúc 3 giờ sáng, kể cả khi chẳng có gì để làm.

<!-- SPEAKER NOTES
Đây là nguồn chi phí ẩn lớn nhất trong hầu hết các setup OpenClaw.

Mỗi lần heartbeat đều nạp toàn bộ file workspace và toàn bộ lịch sử hội thoại. Với model đầu bảng, riêng heartbeat đã có thể tốn $30 đến $100 mỗi tháng.

Nhóm này có hai thiết lập: làm heartbeat nhẹ đi rất nhiều, và thêm danh sách tác vụ để agent có thể bỏ qua luôn lời gọi LLM nếu không có gì cần làm.
-->

------

<!--slide-attr x=2000 y=5550 rotate=2 scale=1.0 -->

# Thức dậy thông minh hơn

> Đặt báo thức vào giờ làm việc, không phải cứ 30 phút là kêu cả ngày lẫn đêm.

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

Chỉ riêng `isolatedSession: true`: **~100K token → ~2–5K mỗi lần chạy.**

[agents.defaults.heartbeat](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-heartbeat)

<!-- SPEAKER NOTES
Tôi đi nhanh qua từng cờ cấu hình:

every "55m": thưa hơn một chút so với mặc định 30 phút. Vẫn đủ giữ cache ấm nhưng không đốt token vô ích.

lightContext: true — thay vì nạp toàn bộ file workspace, chỉ chèn HEARTBEAT.md. Nếu workspace của bạn có 10.000 token, heartbeat context giảm được khoảng 90%.

isolatedSession: true — mỗi lần heartbeat chạy như một phiên mới, thay vì nạp toàn bộ lịch sử hội thoại. Đây là cú giảm lớn nhất: từ khoảng 100.000 token lịch sử xuống còn 2.000 đến 5.000 token cho mỗi lượt.

skipWhenBusy: true — nếu một lane agent khác đang chạy thì bỏ qua heartbeat này. Không chạy chồng lên nhau.

activeHours — chỉ chạy trong khung giờ này. Ngoài giờ làm việc sẽ không tốn tiền.

model trỏ về một model Ollama local miễn phí: các kiểm tra heartbeat thường quy không cần model frontier.

Gộp lại, các cấu hình này có thể giảm hơn 95% chi phí heartbeat.
-->

------

<!--slide-attr x=0 y=5400 rotate=-2 scale=1.0 -->

# Chỉ trả tiền khi có việc

> Một checklist để agent biết rằng “hôm nay không có gì, ngủ tiếp đi”.

```yaml
<!-- HEARTBEAT.md -->
tasks:
  - id: inbox-check
    interval: 1h
    prompt: "Kiểm tra inbox. Nếu không có gì gấp, trả lời HEARTBEAT_OK."
  - id: memory-consolidate
    interval: 12h
    prompt: "Tóm tắt các file memory vào MEMORY.md."
  - id: weekly-review
    interval: 7d
    prompt: "Viết weekly review vào memory/weekly-YYYY-MM-DD.md."
```

**Chi phí token bằng 0** khi chưa có tác vụ nào đến hạn.

[HEARTBEAT.md task scheduling](https://docs.openclaw.ai/gateway/configuration)

<!-- SPEAKER NOTES
Đây là đòn bẩy chi phí sắc nhất trong toàn bộ hệ thống heartbeat.

Khi bạn thêm block tasks: vào HEARTBEAT.md, OpenClaw sẽ kiểm tra lịch tác vụ trước khi gọi LLM. Nếu chưa có tác vụ nào đến hạn, nó ghi reason=no-tasks-due và bỏ qua hoàn toàn.

Hãy nghĩ xem điều đó có nghĩa gì: heartbeat có thể đánh thức mỗi 55 phút, nhưng nếu vài giờ tới chưa có việc gì đến hạn thì chi phí token bằng 0. Không mất gì cả.

Block tasks: cho bạn lên lịch chính xác khi nào mỗi việc cần chạy — theo giờ, mỗi 12 giờ, hằng tuần. Chỉ những tác vụ thật sự đến hạn mới tạo ra lời gọi LLM.

Kết hợp với D.1, bạn có thể kéo chi phí heartbeat từ mức $30-$100/tháng xuống còn vài đô hoặc thấp hơn nữa.
-->

------

<!--slide-attr x=0 y=7200 rotate=3 scale=0.9 -->

# `openclaw.json` hoàn chỉnh

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
          "prompt": "Ghi các ghi chú bền vững vào memory/YYYY-MM-DD.md. Trả lời NO_REPLY nếu không có gì cần lưu."
        }
      },
      "memorySearch": { "provider": "openai" }
    }
  }
}
```

<!-- SPEAKER NOTES
Đây là toàn bộ 8 cấu hình gộp lại trong một file.

Đây không phải cấu hình minh họa cho đẹp. Đây là cấu hình đã được thử nghiệm trong môi trường production, bao phủ đủ context budget, memory, model routing và heartbeat trong cùng một chỗ.

Bạn có thể copy ngay bây giờ rồi chỉnh cho phù hợp với setup của mình. Những thứ có thể muốn thay đổi là:
- Đổi model chính sang model bạn đang dùng
- Chỉnh activeHours theo múi giờ và lịch làm việc của bạn
- Bỏ các tham chiếu Ollama nếu bạn không chạy model local

Tiếp theo: cách áp dụng trong khoảng 10 giây.
-->

------

<!--slide-attr x=2000 y=7050 rotate=-2 scale=1.0 -->

# Áp dụng ngay bây giờ

1. Mở một cuộc chat với agent của bạn
2. Dán cấu hình ở trên
3. Nói: `"Hãy cập nhật openclaw.json của tôi theo cấu hình này"`

Agent sẽ tự áp dụng thay đổi và khởi động lại.

> Không cần terminal, không cần sửa file thủ công, không cần tự restart.

<!-- SPEAKER NOTES
Đây là ý chính của toàn bộ bài nói. Bạn không cần phải đi tìm file, sửa JSON bằng tay hay tự khởi động lại gì cả.

Chỉ cần trò chuyện. Dán cấu hình vào. Yêu cầu agent áp dụng.

Việc này hoạt động vì agent OpenClaw có thể tự sửa file cấu hình của chính nó — và nó biết chính xác openclaw.json nằm ở đâu.

Nếu muốn an toàn hơn, hãy yêu cầu agent show diff trước khi áp dụng. Đó là cách tốt để kiểm tra trước mọi thay đổi.

Với team production: bạn có thể version-control file openclaw.json trong một repository riêng tư rồi để agent tự pull và áp dụng khi cần.
-->

------

<!--slide-attr x=4000 y=7350 rotate=2 scale=1.0 -->

# Tối ưu là một vòng lặp

```
Quan sát → Ghi lại → Cải thiện → Lặp lại
```

- **Quan sát:** Xem breakdown chi phí API theo tháng
- **Ghi lại:** Ghi chú thao tác nào đang tốn nhiều nhất
- **Cải thiện:** Chỉnh từng cấu hình một, rồi đo lại thay đổi
- **Lặp lại:** Tối ưu trong production là một thói quen, không phải việc làm một lần

> Những cấu hình hôm nay là điểm khởi đầu rất tốt, không phải đáp án cuối cùng.

<!-- SPEAKER NOTES
Tối ưu không phải là việc làm một lần rồi xong. Cách bạn sử dụng thay đổi, model mới xuất hiện, agent của bạn cũng sẽ nhận thêm việc mới.

Vòng lặp rất đơn giản: xem bạn đã tốn gì, hiểu cái gì đang gây tốn, đổi một thứ, rồi đo lại.

Log của OpenClaw có đủ chi tiết để lần ra heartbeat nào đã chạy, model nào đã được dùng, mỗi lượt tiêu tốn bao nhiêu token. Hãy dùng những log đó.

Hãy bắt đầu với heartbeat — đây là nhóm có tác động lớn nhất và khá an toàn vì hầu như không ảnh hưởng tới chất lượng đầu ra.

Sau đó tới context injection và pruning. Rồi caching. Cuối cùng là memory.

Mỗi bước sẽ cộng dồn hiệu quả lên bước trước. Sau hai hoặc ba vòng lặp, bạn sẽ có một cấu hình rất khớp với workflow thực tế của mình.
-->

------

<!--slide-attr x=6000 y=7200 rotate=-1 scale=1.2 -->

# Cảm ơn mọi người

Mọi người có câu hỏi nào không?

Hoặc muốn giao lưu thêm cũng được.

Có thể liên hệ với tôi tại

[https://github.com/vanduc2514](https://github.com/vanduc2514)

<!-- SPEAKER NOTES
Dành đủ thời gian cho phần hỏi đáp — chủ đề này thường tạo ra nhiều câu hỏi thú vị.

Một vài câu hỏi thường gặp để chuẩn bị sẵn:
1. "continuation-skip có bao giờ bỏ sót thứ quan trọng không?" — Không, vì nó vẫn dựng lại đầy đủ ở heartbeat và các lượt sau compaction.
2. "Nếu tôi không cài Ollama thì sao?" — Hãy bỏ các override model cho heartbeat và memoryFlush. Khi đó hệ thống sẽ dùng model chính.
3. "Có cách nào nhìn thấy mức tiết kiệm trước và sau không?" — Có, hãy so sánh dashboard token usage của provider trước và sau khi áp dụng cấu hình.
4. "Thiết lập này có chạy với OpenRouter không?" — Có, tất cả các thiết lập đều áp dụng với mọi provider. Chỉ cần tên model đúng theo định dạng OpenRouter.

Kết bằng câu: "Cấu hình nằm sẵn trong repo nếu mọi người muốn copy ngay bây giờ."
-->
