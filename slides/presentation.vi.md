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

Bằng cách thay đổi cấu hình `openclaw.json`

<!-- SPEAKER NOTES
Chào mừng mọi người. Hôm nay chúng ta sẽ cùng thảo luận về một chủ đề cực kỳ thực tế và "bắt tay vào làm luôn": cách tối ưu hóa một AI agent chạy trên OpenClaw để vừa tiết kiệm chi phí, vừa chạy nhanh hơn mà vẫn đảm bảo độ tin cậy.

(Tự giới thiệu bản thân ngắn gọn. Chia sẻ một chút về kinh nghiệm vận hành OpenClaw trong môi trường thực tế của bạn).
-->

------

<!--slide-attr x=2000 y=-150 rotate=-2 scale=1.0 -->

# Vấn đề của Agent: "Nghiện" tiêu tiền

- Cứ mỗi tin nhắn mới, hệ thống lại **gửi lại toàn bộ các tin nhắn trước đó**
- Tính năng chạy nền (background check) tự động kích hoạt **mỗi 30 phút một lần**
- Các file trong không gian làm việc (workspace) bị tải lại **ở mỗi lượt chat**

> Các cấu hình mặc định của OpenClaw nhằm đảm bảo hoạt động tốt trong điều kiện lý tưởng về mặt chi phí

<!-- SPEAKER NOTES
Đây chính là nguyên nhân cốt lõi của những chiếc hóa đơn API "trên trời" mà bạn không lường trước.

Hỏi khán giả: "Ở đây có ai từng giật mình khi nhìn thấy hóa đơn API cuối tháng chưa?" (Thường sẽ có vài người giơ tay).

Đây không phải là lỗi — đây là cách các mô hình ngôn ngữ lớn (LLM) hoạt động. Nhưng tin vui là OpenClaw cung cấp cho chúng ta các "nút vặn" để kiểm soát điều đó.
-->

------

<!--slide-attr x=4000 y=150 rotate=2 scale=1.0 -->

# Con số thực tế: Chi phí là bao nhiêu?

> **Chi phí** = **Số lượng token** x **Đơn giá Model**

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

# Làm chủ `openclaw.json`

> Thay đổi các giá trị mặc định trong file này có thể **Cắt giảm 60–80% chi phí.**.

```json
{
  "agents": {
    "defaults": {
      "..."
    }
  }
}
```

<!-- SPEAKER NOTES
Đây là thông điệp chính: tất cả những gì chúng ta sắp bàn đến đều nằm trong một file JSON.

Không cần sửa code, không cần triển khai lại, không cần cơ sở hạ tầng phức tạp. Bạn chỉ cần chỉnh sửa một file rồi khởi động lại OpenClaw.

Chúng ta sẽ đề cập đến 9 cấu hình chia thành 4 nhóm. Cuối cùng tôi sẽ trình bày file cấu hình tổng hợp đầy đủ mà bạn có thể copy-paste trực tiếp.
-->

------

<!--slide-attr x=6000 y=1800 rotate=3 scale=1.0 -->

# Tối ưu ngữ cảnh

> AI sẽ được "nhồi" những gì vào bộ nhớ ở mỗi lượt giao task?

Mỗi ký tự trong ngữ cảnh của bạn làm tăng số lượng tokens.

Các thiết lập sau đây giúp bạn kiểm soát **dung lượng của ngữ cảnh đó**.

<!-- SPEAKER NOTES
Hãy hình dung mỗi lượt AI như việc gửi một gói hàng. Nhóm cài đặt này kiểm soát xem gói hàng đó chứa những gì.

Mặc định, OpenClaw nhét toàn bộ các file workspace vào mỗi lần gửi. Chúng ta có thể thay đổi điều đó.

Có hai cài đặt chính ở đây: bỏ qua việc nạp lại bối cảnh trong các lượt tiếp theo, và xóa kết quả tool cũ sau một khoảng thời gian nhất định.
-->

------

<!--slide-attr x=4000 y=1650 rotate=-2 scale=1.0 -->

# Hạn chế lặp ngữ cảnh

> Mặc định các ngữ cảnh cũ sẽ bị lặp lại với mỗi lần giao task

```json
{
  "contextInjection": "continuation-skip",
  "bootstrapMaxChars": 12000,
  "bootstrapTotalMaxChars": 60000
}
```

Trong một phiên chat 20 lượt: lượt thứ 18 sẽ không nạp lại ngữ cảnh giống nhau.

[agents.defaults.contextInjection](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextinjection)

<!-- SPEAKER NOTES
contextInjection kiểm soát thời điểm các file bootstrap của workspace — SOUL.md, AGENTS.md và các file tương tự — được nạp vào system prompt.

Giá trị mặc định là "always", nghĩa là mỗi lượt tiếp theo đều phải trả toàn bộ chi phí token bootstrap.

"continuation-skip" là cài đặt bạn cần. Nó bỏ qua việc nạp lại trong các lượt tiếp theo an toàn và vẫn tái tạo đầy đủ trong các heartbeat và sau compaction — nên không có thông tin quan trọng nào bị mất.

Giới hạn ký tự là biện pháp bảo vệ: nếu ai đó vô tình viết một file AGENTS.md quá lớn

Tác động rất đáng kể: trong một cuộc trò chuyện 20 lượt thông thường với 10.000 token workspace, bạn loại bỏ được việc nạp lại trong khoảng 18 trong số 20 lượt đó.
-->

------

<!--slide-attr x=2000 y=1950 rotate=2 scale=1.0 -->

# Dọn dẹp kết quả chạy tool

> Tool đã chạy xong thì không nên giữ kết quả lại quá lâu

```json
{
  "contextPruning": {
    "mode": "cache-ttl",
    "ttl": "1h"
  }
}
```

Loại bỏ đầu ra, đầu vào của các công cụ đã chạy trước đó, giúp giảm những tokens thừa thãi trong ngữ cảnh.

[agents.defaults.contextPruning](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-contextpruning)

<!-- SPEAKER NOTES
Khi agent đọc một file, duyệt web, hay chạy lệnh shell, toàn bộ kết quả đó được lưu vào lịch sử cuộc trò chuyện.

Sau một thời gian — đặc biệt trong các phiên làm việc dài — những kết quả đó đã lỗi thời. Bạn đã xử lý chúng xong rồi. Nhưng chúng vẫn chiếm không gian trong mỗi lần gọi API tiếp theo.

contextPruning xóa chúng khỏi bộ nhớ trước mỗi lần gọi LLM. Nó không xóa transcript trên đĩa của bạn, nên không có gì bị mất vĩnh viễn.

Với TTL là 1h, bất kỳ kết quả tool nào cũ hơn một tiếng sẽ được dọn dẹp tự động.
-->

------

<!--slide-attr x=0 y=1800 rotate=-3 scale=1.0 -->

# Tối ưu trí nhớ

> Agent sẽ nhớ được những gì giữa các phiên làm việc?

**Không có trí nhớ tốt:** 
- AI quên mất những gì đã được dạy khi bắt đầu làm việc.
- AI phải nghiên cứu lại, thử sai nhiều, làm tăng số lượng token và số lần request

**Có trí nhớ tốt:**
- AI sẽ nhớ lại những thứ được dạy trước khi bắt đầu làm việc.

<!-- SPEAKER NOTES
Nhóm này tập trung vào việc đảm bảo những điều quan trọng được lưu giữ đúng cách.

Hai tình huống then chốt: điều gì xảy ra khi cửa sổ bối cảnh đầy và bị tóm tắt lại (compaction), và cách agent tìm lại những thông tin đã lưu trong bộ nhớ.
-->

------

<!--slide-attr x=0 y=3600 rotate=2 scale=1.0 -->

# Ghi nhớ khi cửa sổ ngữ cảnh sắp đầy

> Ghi nhớ những thông tin quan trọng trước khi tóm tắt ngữ cảnh hiện tại

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

Ghi nhớ mỗi khi tóm tắt, nên sử dụng **mô hình miễn phí**, để giảm thiểu chi phí tới mức thấp nhất.

[compaction.memoryFlush](https://docs.openclaw.ai/concepts/compaction#memory-flush)

<!-- SPEAKER NOTES
Vấn đề: các chi tiết quan trọng có thể bị mất trong quá trình tóm tắt. Những quyết định quan trọng, các task đang mở, trạng thái dự án hiện tại — tất cả có thể biến mất.

Nhiệm vụ duy nhất của nó là lưu lại những thông tin không muốn bị mất khi tóm tắt.
-->

------

<!--slide-attr x=2000 y=3450 rotate=-2 scale=1.0 -->

# Gợi nhớ lại theo ngôn ngữ tự nhiên

> Sự khác biệt giữa việc bấm `Ctrl+F` tìm từ khóa và tìm bằng ngôn ngữ tự nhiên.

```json
{
  "memorySearch": {
    "provider": "openai"
  }
}
```

Kích hoạt **tìm kiếm kết hợp (hybrid search)**: khớp từ khóa + tìm kiếm ngữ nghĩa (vector similarity).

Cho phép tìm kiếm bằng ngôn ngữ tự nhiên, giúp AI truy xuất thông tin chính xác hơn.

[agents.defaults.memorySearch](https://docs.openclaw.ai/concepts/memory-search)

<!-- SPEAKER NOTES
Trước thời đại AI, chúng ta tìm kiếm bằng từ khóa. Sau thời đại AI, chúng ta tìm kiếm bằng ngôn ngữ tự nhiên

AI cũng vậy, tìm kiếm bằng ngôn ngữ tự nhiên sẽ cho kết quả tốt hơn là chỉ tìm kiếm bằng từ khóa thông thường

OpenClaw có một engine bộ nhớ SQLite tích hợp. Mặc định nó dùng FTS5 để tìm kiếm từ khóa — nhanh nhưng theo nghĩa đen.

Khi cấu hình provider, bạn có tìm kiếm kết hợp: FTS5 cho kết quả khớp chính xác cộng với vector embeddings để tìm theo ngữ nghĩa tương tự.

Ví dụ thực tế: bạn đã lưu ghi chú về "giới hạn tần suất API" ba tháng trước. Sau đó bạn hỏi về "tại sao các request bị chặn lại". Tìm kiếm từ khóa không thấy. Tìm kiếm kết hợp lại tìm được.

Cài đặt này tự phát hiện API key của bạn. Nếu bạn đã cấu hình OpenAI, nó hoạt động ngay.
-->

------

<!--slide-attr x=4000 y=3750 rotate=3 scale=1.0 -->

# Tối ưu mô hình ngôn ngữ lớn

> Sử dụng tối ưu não bộ của AI

------

<!--slide-attr x=6000 y=5400 rotate=2 scale=1.0 -->

# Luôn luôn có phương án B

> Nếu model này không khả dụng, chuyển ngay sang model khác.

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

[agents.defaults.model.fallbacks](https://docs.openclaw.ai/concepts/model-failover#model-fallback)

<!-- SPEAKER NOTES
Giống như trong một Team, nếu member A nghỉ phép, công việc sẽ được điều hướng sang cho member B.

Cài đặt này phục vụ hai mục đích: độ tin cậy và chi phí.

Về độ tin cậy: khi mô hình cao cấp bị quá tải — điều thường xảy ra vào giờ cao điểm — OpenClaw tự động chuyển sang mô hình tiếp theo trong chuỗi. Không có lỗi, không bị gián đoạn, không cần can thiệp thủ công.

Về chi phí: đặt các mô hình rẻ hơn ở cuối chuỗi dự phòng. Các tác vụ nền ngoài giờ cao điểm chạy trên mô hình dự phòng sẽ rẻ hơn đáng kể so với mô hình chính.

Lưu ý quan trọng: điều này áp dụng cho các cài đặt mặc định. Nếu người dùng chọn mô hình cụ thể bằng lệnh /model, sẽ không có dự phòng nào được áp dụng — điều này bảo toàn ý định của người dùng.
-->

------

<!--slide-attr x=6000 y=3600 rotate=-2 scale=1.0 -->

# Cache câu lệnh hệ thống (System Prompt)

> Để AI tạm ghi nhớ câu lệnh hệ thống thay vì phải nhắc liên tục.

```json
{
  "params": {
    "cacheRetention": "long"
  }
}
```

- **Tăng tốc độ** tạo sinh token do không cần phải tính toán lại thành vector
- **Giảm tới 90% chi phí** cho các token đã được cache khi dùng Anthropic.

Hoạt động theo từng model và từng agent. Có 3 cấp độ: `none`, `short`, `long` tùy vào thời gian muốn giữ lại các token đã được tính toán.

[agents.defaults.params.cacheRetention](https://docs.openclaw.ai/gateway/config-agents#agents-defaults-params-cacheretention)

<!-- SPEAKER NOTES
Giống như là con người, chúng ta có những phần não bộ để lưu trữ thông tin bối cảnh tạm thời để xử lý ngay lập tức, hoặc để lưu những hiểu biết có tính lâu dài để hiểu ngay khi cần thiết.

Sử dụng cache để AI tối ưu sử dụng KV Cache lưu trữ những token đã được encode thành vector để không phải mất thời gian đi tính toán lại

Khi bạn đặt cacheRetention là "long", OpenClaw yêu cầu provider giữ system prompt trong cache. Các lượt tiếp theo có cùng prefix chỉ trả một phần nhỏ giá token đầu vào thông thường.

Anthropic cung cấp giảm giá lên đến 90% cho các token được cache. Với một system prompt 10.000 token được gửi lại 50 lần mỗi ngày, đây là khoản tiết kiệm rất đáng kể.

Bạn có thể ghi đè cài đặt này theo từng model hoặc từng agent. Ví dụ, tắt nó cho các agent có system prompt thay đổi ở mỗi lần chạy.
-->

------

<!--slide-attr x=4000 y=5250 rotate=-3 scale=1.0 -->

# Tối ưu các tác vụ định kỳ

> Agent sẽ làm gì khi không có ai trò chuyện với nó?

Mặc định: Cứ 30 phút AI lại "thức dậy" một lần để chạy các tác vụ trong HEARTBEAT.md, kể cả khi chẳng có việc gì để làm.

<!-- SPEAKER NOTES
Đây là yếu tố chi phí ẩn lớn nhất trong hầu hết các cài đặt OpenClaw.

Mỗi heartbeat tải tất cả file workspace và toàn bộ lịch sử cuộc trò chuyện. Chỉ riêng heartbeat trên mô hình cao cấp có thể tiêu tốn 30 đến 100 USD mỗi tháng.

Có hai cài đặt ở đây: tinh chỉnh heartbeat để nhẹ hơn nhiều, và thêm danh sách task để agent có thể bỏ qua hoàn toàn lời gọi LLM khi không có gì cần làm.
-->

------

<!--slide-attr x=2000 y=5550 rotate=2 scale=1.0 -->

# Tối ưu nhịp tim của Agent (HEARTBEAT)

> **Chi phí** = **Số lần tim đập** x (**Số lượng token** x **Đơn giá Model**)

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

<!-- SPEAKER NOTES
Giống như là con người, nếu liên tục làm những việc vô nghĩa sẽ tốn năng lượng một cách phung phí.

AI cũng vậy, nếu liên tục chạy những việc không mang lại giá trị, sẽ tốn token, dẫn đến tốn chi phí một cách không hiệu quả

Hãy để tôi giải thích từng tham số:

every "55m": tần suất thấp hơn một chút so với mặc định 30 phút. Giữ cho cache luôn ấm mà không đốt token.

lightContext: true — thay vì tải tất cả file workspace, chỉ nạp HEARTBEAT.md. Nếu workspace của bạn là 10.000 token, cài đặt này giảm 90% bối cảnh heartbeat.

isolatedSession: true — mỗi lần chạy heartbeat bắt đầu như một phiên mới thay vì tải toàn bộ lịch sử cuộc trò chuyện. Đây là cái lợi lớn nhất: giảm từ khoảng 100.000 token lịch sử xuống còn 2.000 đến 5.000 token mỗi lần chạy.

skipWhenBusy: true — nếu một lane agent khác đang chạy, bỏ qua heartbeat này. Không chạy chồng chéo.

activeHours — chỉ kích hoạt trong các giờ này. Không phát sinh chi phí ngoài giờ làm việc.

model trỏ về mô hình Ollama local miễn phí: các lần kiểm tra heartbeat thông thường không cần mô hình frontier.

Kết hợp lại, các cài đặt này có thể giảm chi phí heartbeat hơn 95%.
-->

------

<!--slide-attr x=0 y=5400 rotate=-2 scale=1.0 -->

# Chỉ thực thi khi thực sự có việc

> Một danh sách kiểm tra giúp Agent tự hiểu: "Hôm nay không có việc gì đâu, đi ngủ tiếp đi thôi."

Trong file `HEARTBEAT.md`:

```yaml
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

[HEARTBEAT.md tasks blocks](https://docs.openclaw.ai/gateway/heartbeat#tasks-blocks)

<!-- SPEAKER NOTES
Đây là đòn bẩy chi phí sắc bén nhất trong toàn bộ hệ thống heartbeat.

Khi bạn thêm block tasks: vào HEARTBEAT.md, OpenClaw đánh giá lịch trình task trước khi thực hiện bất kỳ lời gọi LLM nào. Nếu không có task nào đến hạn, nó ghi log reason=no-tasks-due và bỏ qua hoàn toàn.

Hãy nghĩ xem điều đó có nghĩa gì: một heartbeat kích hoạt mỗi 55 phút nhưng không có task nào đến hạn trong vài giờ tới thì chi phí bằng không. Không có gì. Bạn không bị tính phí gì cả.

Block tasks: cho phép bạn lên lịch chính xác khi nào mỗi lần kiểm tra nên chạy — hàng giờ, mỗi 12 giờ, hàng tuần. Chỉ các task thực sự đến hạn mới kích hoạt lời gọi LLM.

Kết hợp với D.1, bạn đi từ heartbeat tốn 30-100 USD/tháng xuống còn vài đô la hoặc thậm chí ít hơn.
-->

------

<!--slide-attr x=0 y=7200 rotate=3 scale=0.9 -->

# File `openclaw.json` tối ưu

Ra lệnh: `"Cập nhật file openclaw.json của tôi với cấu hình này nhé"`

```jsonc
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

<!-- SPEAKER NOTES
Ví dụ cho file cấu hình openclaw.json hoàn chỉnh chứa các tối ưu trên

Đây là cấu hình được nhắc đến trong tài liệu của openclaw.
-->

------

<!--slide-attr x=4000 y=7350 rotate=2 scale=0.92 -->

# Các bước để tối ưu hiệu quả

> Đừng tối ưu khi chưa bị đau ví và ưu tiên các tối ưu quan trọng trước

<div style="display:flex; gap:16px; align-items:stretch; margin: 12px 0 4px;">
  <div style="flex:1; text-align:center;">
    <img src="images/optimization-loop.png" alt="Vong lap toi uu: Quan sat, Danh gia, Cai tien, Do luong" style="height: 220px; width: 100%; object-fit: contain;" />
    <p><strong>Vòng lặp tối ưu liên tục</strong></p>
  </div>
  <div style="flex:1; text-align:center;">
    <img src="images/optimization-priority.png" alt="Thu tu uu tien toi uu tu tren xuong" style="height: 220px; width: 100%; object-fit: contain;" />
    <p><strong>Thứ tự ưu tiên triển khai</strong></p>
  </div>
</div>

- **Quan sát:** Kiểm tra chi phí Model và chất lượng cộng việc trước khi tối ưu
- **Đánh giá:** Đánh giá xem tác vụ nào đang ngốn nhiều tiền nhất thông qua log
- **Cải tiến:** Thay đổi cấu hình, lặp lại việc quan sát và đánh giá
- **Đo lường:** Đo lường sự giảm chi phí và tăng chất lượng công việc

<!-- SPEAKER NOTES
Log của OpenClaw bao gồm đủ chi tiết để theo dõi heartbeat nào đã kích hoạt, mô hình nào được sử dụng, bao nhiêu token mỗi lượt đã tiêu thụ. Hãy sử dụng những log đó.

Bắt đầu với cài đặt heartbeat, tác động cao nhất và an toàn khi thay đổi mà không ảnh hưởng chất lượng output.

Sau đó chuyển sang context injection và pruning. Rồi caching. Rồi memory.

Mỗi bước xây dựng trên bước trước. Sau hai hoặc ba vòng lặp, bạn sẽ có cấu hình được điều chỉnh phù hợp cho quy trình làm việc cụ thể của mình.
-->

------

<!--slide-attr x=6000 y=7200 rotate=-1 scale=1.2 -->

# Xin cảm ơn mọi người

Mọi người có câu hỏi hoặc muốn giao lưu kết nối

Vui lòng liên hệ với mình qua:

[https://github.com/vanduc2514](https://github.com/vanduc2514)

<!-- SPEAKER NOTES
Để lại nhiều thời gian cho phần hỏi đáp — chủ đề này luôn tạo ra những cuộc thảo luận thú vị.

Các câu hỏi thường gặp:
1. "continuation-skip có bao giờ bỏ lỡ thông tin quan trọng không?" — Không, nó tái tạo đầy đủ trong các lượt heartbeat và sau-compaction.
2. "Nếu tôi không cài Ollama thì sao?" — Xóa các ghi đè model cho heartbeat và memoryFlush. Mặc định sẽ dùng mô hình chính của bạn.
3. "Có cách nào xem tiết kiệm chi phí trước và sau không?" — Có, so sánh bảng sử dụng token của API provider trước và sau khi áp dụng config.
4. "Cái này có hoạt động với OpenRouter không?" — Có, tất cả cài đặt đều áp dụng bất kể provider. Tên mô hình chỉ cần theo định dạng OpenRouter.

Kết thúc với: "Config đầy đủ có trong README của repo nếu bạn muốn copy ngay bây giờ."
-->
