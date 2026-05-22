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

<!-- SPEAKER NOTES
Đây là thông điệp chính: tất cả những gì chúng ta sắp bàn đến đều nằm trong một file JSON trên máy tính của bạn.

Không cần sửa code, không cần triển khai lại, không cần cơ sở hạ tầng phức tạp. Bạn chỉ cần chỉnh sửa một file rồi khởi động lại OpenClaw.

Chúng ta sẽ đề cập đến 8 cấu hình chia thành 4 nhóm. Cuối cùng tôi sẽ trình bày file cấu hình tổng hợp đầy đủ mà bạn có thể copy-paste trực tiếp.
-->

------

<!--slide-attr x=6000 y=1800 rotate=3 scale=1.0 -->

# Hạn mức ngữ cảnh (Context Budget)

> AI sẽ được "nhồi" những gì vào bộ nhớ ở mỗi lượt chat?

Mỗi ký tự trong các file dự án của bạn = tokens = tiền.

Các thiết lập này giúp bạn kiểm soát **dung lượng của gói dữ liệu đó**.

<!-- SPEAKER NOTES
Hãy hình dung mỗi lượt AI như việc gửi một gói hàng. Nhóm cài đặt này kiểm soát xem gói hàng đó chứa những gì.

Mặc định, OpenClaw nhét toàn bộ các file workspace vào mỗi lần gửi. Chúng ta có thể thay đổi điều đó.

Có hai cài đặt chính ở đây: bỏ qua việc nạp lại bối cảnh trong các lượt tiếp theo, và xóa kết quả tool cũ sau một khoảng thời gian nhất định.
-->

------

<!--slide-attr x=4000 y=1650 rotate=-2 scale=1.0 -->

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

<!-- SPEAKER NOTES
contextInjection kiểm soát thời điểm các file bootstrap của workspace — SOUL.md, AGENTS.md và các file tương tự — được nạp vào system prompt.

Giá trị mặc định là "always", nghĩa là mỗi lượt tiếp theo đều phải trả toàn bộ chi phí token bootstrap.

"continuation-skip" là cài đặt bạn cần. Nó bỏ qua việc nạp lại trong các lượt tiếp theo an toàn và vẫn tái tạo đầy đủ trong các heartbeat và sau compaction — nên không có thông tin quan trọng nào bị mất.

Giới hạn ký tự là biện pháp bảo vệ: nếu ai đó vô tình viết một file AGENTS.md quá lớn, nó sẽ không làm vỡ ngân sách bối cảnh của bạn.

Tác động rất đáng kể: trong một cuộc trò chuyện 20 lượt thông thường với 10.000 token workspace, bạn loại bỏ được việc nạp lại trong khoảng 18 trong số 20 lượt đó.
-->

------

<!--slide-attr x=2000 y=1950 rotate=2 scale=1.0 -->

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

<!-- SPEAKER NOTES
Khi agent đọc một file, duyệt web, hay chạy lệnh shell, toàn bộ kết quả đó được lưu vào lịch sử cuộc trò chuyện.

Sau một thời gian — đặc biệt trong các phiên làm việc dài — những kết quả đó đã lỗi thời. Bạn đã xử lý chúng xong rồi. Nhưng chúng vẫn chiếm không gian trong mỗi lần gọi API tiếp theo.

contextPruning xóa chúng khỏi bộ nhớ trước mỗi lần gọi LLM. Nó không xóa transcript trên đĩa của bạn, nên không có gì bị mất vĩnh viễn.

Với TTL là 1h, bất kỳ kết quả tool nào cũ hơn một tiếng sẽ được dọn dẹp tự động.
-->

------

<!--slide-attr x=0 y=1800 rotate=-3 scale=1.0 -->

# Bộ nhớ & Trạng thái (Memory & State)

> Agent sẽ nhớ được những gì giữa các phiên làm việc?

Không có bộ nhớ tốt: AI quên bạn là ai ở mỗi lần chạy.

Có bộ nhớ tốt: AI sẽ tiếp tục công việc ngay lập tức.

<!-- SPEAKER NOTES
Nhóm này tập trung vào việc đảm bảo những điều quan trọng được lưu giữ đúng cách.

Hai tình huống then chốt: điều gì xảy ra khi cửa sổ bối cảnh đầy và bị tóm tắt lại (compaction), và cách agent tìm lại những thông tin đã lưu trong bộ nhớ.
-->

------

<!--slide-attr x=0 y=3600 rotate=2 scale=1.0 -->

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

<!-- SPEAKER NOTES
Compaction xảy ra tự động khi cửa sổ bối cảnh gần đầy. OpenClaw tóm tắt tất cả thành dạng cô đọng hơn và tiếp tục.

Vấn đề: các chi tiết quan trọng có thể bị mất trong quá trình tóm tắt đó. Những quyết định quan trọng, các task đang mở, trạng thái dự án hiện tại — tất cả có thể biến mất.

memoryFlush khởi động một lượt agent thầm lặng ngay trước khi compaction. Nhiệm vụ duy nhất của nó là ghi các ghi chú bền vững vào file trên đĩa.

Phần tuyệt vời: bạn có thể trỏ cài đặt này về một mô hình local miễn phí như Qwen 3 8B chạy trên Ollama. Đây là tác vụ ghi thuần túy — không cần thông minh, chỉ cần đáng tin cậy. Chi phí API bằng 0.
-->

------

<!--slide-attr x=2000 y=3450 rotate=-2 scale=1.0 -->

# Tìm kiếm bộ nhớ thông minh hơn

> Sự khác biệt giữa việc bấm `Ctrl+F` tìm từ khóa và tìm bằng ngôn ngữ tự nhiên.

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

<!-- SPEAKER NOTES
OpenClaw có một engine bộ nhớ SQLite tích hợp. Mặc định nó dùng FTS5 để tìm kiếm từ khóa — nhanh nhưng theo nghĩa đen.

Khi cấu hình provider, bạn có tìm kiếm kết hợp: FTS5 cho kết quả khớp chính xác cộng với vector embeddings để tìm theo ngữ nghĩa tương tự.

Ví dụ thực tế: bạn đã lưu ghi chú về "giới hạn tần suất API" ba tháng trước. Sau đó bạn hỏi về "tại sao các request bị chặn lại". Tìm kiếm từ khóa không thấy. Tìm kiếm kết hợp lại tìm được.

Cài đặt này tự phát hiện API key của bạn. Nếu bạn đã cấu hình OpenAI, nó hoạt động ngay.
-->

------

<!--slide-attr x=4000 y=3750 rotate=3 scale=1.0 -->

# Định tuyến mô hình (Model Routing)

> Chọn mặt gửi vàng: Việc nào thì đi với mô hình đó.

Không phải việc gì cũng cần đến mô hình đắt tiền nhất.

Định tuyến thông minh giúp bạn chọn đúng công cụ cho đúng việc, với mức giá hợp lý nhất.

<!-- SPEAKER NOTES
Điểm mấu chốt: bạn đang dùng một mô hình cao cấp đắt tiền cho tất cả mọi thứ, kể cả những kiểm tra nền đơn giản mà một mô hình rẻ hơn hoặc miễn phí có thể xử lý hoàn toàn ổn.

Hai cài đặt ở đây: cache prompt để tránh xử lý lại, và chuỗi dự phòng tự động dùng mô hình rẻ hơn khi mô hình chính bị quá tải.
-->

------

<!--slide-attr x=6000 y=3600 rotate=-2 scale=1.0 -->

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

<!-- SPEAKER NOTES
Prompt caching là tính năng cấp provider mà OpenClaw cung cấp như một key cấu hình hạng nhất.

Khi bạn đặt cacheRetention là "long", OpenClaw yêu cầu provider giữ system prompt trong cache. Các lượt tiếp theo có cùng prefix chỉ trả một phần nhỏ giá token đầu vào thông thường.

Anthropic cung cấp giảm giá lên đến 90% cho các token được cache. Với một system prompt 10.000 token được gửi lại 50 lần mỗi ngày, đây là khoản tiết kiệm rất đáng kể.

Bạn có thể ghi đè cài đặt này theo từng model hoặc từng agent. Ví dụ, tắt nó cho các agent có system prompt thay đổi ở mỗi lần chạy.
-->

------

<!--slide-attr x=6000 y=5400 rotate=2 scale=1.0 -->

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

<!-- SPEAKER NOTES
Cài đặt này phục vụ hai mục đích: độ tin cậy và chi phí.

Về độ tin cậy: khi mô hình cao cấp bị quá tải — điều thường xảy ra vào giờ cao điểm — OpenClaw tự động chuyển sang mô hình tiếp theo trong chuỗi. Không có lỗi, không bị gián đoạn, không cần can thiệp thủ công.

Về chi phí: đặt các mô hình rẻ hơn ở cuối chuỗi dự phòng. Các tác vụ nền ngoài giờ cao điểm chạy trên mô hình dự phòng sẽ rẻ hơn đáng kể so với mô hình chính.

Lưu ý quan trọng: điều này áp dụng cho các cài đặt mặc định. Nếu người dùng chọn mô hình cụ thể bằng lệnh /model, sẽ không có dự phòng nào được áp dụng — điều này bảo toàn ý định của người dùng.
-->

------

<!--slide-attr x=4000 y=5250 rotate=-3 scale=1.0 -->

# Lên lịch chạy nền (Heartbeat Scheduling)

> Agent sẽ làm gì khi không có ai trò chuyện với nó?

Mặc định: Cứ 30 phút lại thức dậy một lần để chạy các chu kỳ kiểm tra đắt đỏ, kể cả lúc 3 giờ sáng, kể cả khi chẳng có việc gì để làm.

<!-- SPEAKER NOTES
Đây là yếu tố chi phí ẩn lớn nhất trong hầu hết các cài đặt OpenClaw.

Mỗi heartbeat tải tất cả file workspace và toàn bộ lịch sử cuộc trò chuyện. Chỉ riêng heartbeat trên mô hình cao cấp có thể tiêu tốn 30 đến 100 USD mỗi tháng.

Có hai cài đặt ở đây: tinh chỉnh heartbeat để nhẹ hơn nhiều, và thêm danh sách task để agent có thể bỏ qua hoàn toàn lời gọi LLM khi không có gì cần làm.
-->

------

<!--slide-attr x=2000 y=5550 rotate=2 scale=1.0 -->

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

<!-- SPEAKER NOTES
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

<!-- SPEAKER NOTES
Đây là đòn bẩy chi phí sắc bén nhất trong toàn bộ hệ thống heartbeat.

Khi bạn thêm block tasks: vào HEARTBEAT.md, OpenClaw đánh giá lịch trình task trước khi thực hiện bất kỳ lời gọi LLM nào. Nếu không có task nào đến hạn, nó ghi log reason=no-tasks-due và bỏ qua hoàn toàn.

Hãy nghĩ xem điều đó có nghĩa gì: một heartbeat kích hoạt mỗi 55 phút nhưng không có task nào đến hạn trong vài giờ tới thì chi phí bằng không. Không có gì. Bạn không bị tính phí gì cả.

Block tasks: cho phép bạn lên lịch chính xác khi nào mỗi lần kiểm tra nên chạy — hàng giờ, mỗi 12 giờ, hàng tuần. Chỉ các task thực sự đến hạn mới kích hoạt lời gọi LLM.

Kết hợp với D.1, bạn đi từ heartbeat tốn 30-100 USD/tháng xuống còn vài đô la hoặc thậm chí ít hơn.
-->

------

<!--slide-attr x=0 y=7200 rotate=3 scale=0.9 -->

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

<!-- SPEAKER NOTES
Đây rồi — tất cả 8 cấu hình kết hợp thành một file.

Đây không phải là lý thuyết. Đây là cấu hình đã được kiểm nghiệm thực tế bao gồm ngân sách bối cảnh, bộ nhớ, định tuyến mô hình và heartbeat trong một nơi duy nhất.

Bạn có thể copy file này ngay bây giờ và tùy chỉnh cho setup của mình. Những thứ duy nhất bạn có thể muốn thay đổi:
- Đổi mô hình chính thành mô hình bạn đang dùng
- Điều chỉnh activeHours theo múi giờ và lịch làm việc của bạn
- Xóa các tham chiếu Ollama nếu bạn không chạy mô hình local

Tiếp theo: cách áp dụng trong khoảng 10 giây.
-->

------

<!--slide-attr x=2000 y=7050 rotate=-2 scale=1.0 -->

# Cách áp dụng ngay lập tức

1. Mở khung chat với agent của bạn lên
2. Paste đoạn config phía trên vào
3. Ra lệnh: `"Cập nhật file openclaw.json của tôi với cấu hình này nhé"`

Agent sẽ tự động áp dụng các thay đổi và tự khởi động lại hệ thống.

> Không cần mở terminal, không cần tự tay sửa file JSON, không cần gõ lệnh restart thủ công.

<!-- SPEAKER NOTES
Đây chính là mục tiêu của toàn bộ buổi thuyết trình này. Bạn không cần tìm file, sửa JSON thủ công, hay khởi động lại bất cứ thứ gì bằng tay.

Chỉ cần trò chuyện. Dán config vào. Yêu cầu agent áp dụng nó.

Điều này hoạt động vì các agent OpenClaw có thể chỉnh sửa các file cấu hình của chính mình — và chúng biết chính xác vị trí của openclaw.json.

Nếu bạn muốn thận trọng hơn, hãy yêu cầu agent cho bạn xem diff trước khi áp dụng. Đó là cách an toàn để xem xét những gì sẽ thay đổi.
-->

------

<!--slide-attr x=4000 y=7350 rotate=2 scale=1.0 -->

# Cải tiến liên tục

```
Quan sát → Ghi nhận → Cải tiến → Lặp lại
```

- **Quan sát:** Kiểm tra bảng phân bổ chi phí API hàng tháng của bạn
- **Ghi nhận:** Xem tác vụ nào đang ngốn nhiều tiền nhất
- **Cải tiến:** Tinh chỉnh từng thông số một, rồi đo lường sự thay đổi
- **Lặp lại:** Tối ưu hóa sản phẩm là một thói quen lâu dài, không phải chuyện làm một lần là xong

> Cấu hình ngày hôm nay là một bệ phóng tốt, chứ không phải là điểm dừng chân cuối cùng.

<!-- SPEAKER NOTES
Tối ưu hóa không phải là sự kiện xảy ra một lần. Các mẫu sử dụng của bạn thay đổi, các mô hình mới xuất hiện, agent của bạn đảm nhận thêm nhiệm vụ mới.

Vòng lặp rất đơn giản: xem bạn đã chi tiêu những gì, hiểu điều gì dẫn đến chi phí đó, thay đổi một thứ, đo lường lại.

Log của OpenClaw bao gồm đủ chi tiết để theo dõi heartbeat nào đã kích hoạt, mô hình nào được sử dụng, bao nhiêu token mỗi lượt đã tiêu thụ. Hãy sử dụng những log đó.

Bắt đầu với cài đặt heartbeat — tác động cao nhất và an toàn khi thay đổi mà không ảnh hưởng chất lượng output.

Sau đó chuyển sang context injection và pruning. Rồi caching. Rồi memory.

Mỗi bước xây dựng trên bước trước. Sau hai hoặc ba vòng lặp, bạn sẽ có cấu hình được điều chỉnh phù hợp cho quy trình làm việc cụ thể của mình.
-->

------

<!--slide-attr x=6000 y=7200 rotate=-1 scale=1.2 -->

# Xin cảm ơn mọi người

Mọi người có câu hỏi gì không ạ?

Hoặc nếu muốn giao lưu kết nối?

Cứ thoải mái liên hệ với mình qua:

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
