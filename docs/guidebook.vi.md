<!-- Bản thảo tiếng Việt của «Sách hướng dẫn chơi» trong game (Điều khiển → Sách hướng dẫn chơi). Khớp từng mục với docs/guidebook.md.
     Sau khi sửa: python tools/guidebook/build.py → dựng lại js/data/guidebook.js (G.GUIDEBOOK_I18N.vi).
     Ảnh chụp là màn hình tiếng Hàn; các con số khớp với số đỏ trong mỗi ảnh. -->

## Bắt đầu

Mỗi trang có một ảnh chụp màn hình với các số đỏ, kèm giải thích nút mang số đó làm gì. Lật trang bằng **← →**, bấm vào ảnh để phóng to.

### Màn hình tiêu đề

![Màn hình tiêu đề](guide/p01_title)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Hải trình mới | Tạo Đô đốc và bắt đầu ở cảng nhà vào ngày 1 tháng 5 năm 1480 |
| 2 | Chuyến đi đầu tiên (Hướng dẫn) | Hải trình có hướng dẫn 18 bước, bắt đầu ở Sevilla năm 1480. Thủy thủ đoàn dạy bạn từng việc một |
| 3 | Câu chuyện: Tấm ảnh của cha | Chế độ cốt truyện theo một mạch truyện định sẵn |
| 4 | Mở nhật ký | Tải từ 5 ô lưu tự động và 5 ô nhật ký ở nhà trọ |
| 5 | Điều khiển | Tóm tắt các phím điều khiển, và cuốn sách hướng dẫn này |
| 6 | Hiển thị · Phông chữ | Cỡ chữ, phông chữ và cách vẽ chữ (hai trang sau) |

### Tạo Đô đốc

![Tạo Đô đốc](guide/p02_create)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Khuôn mặt trước · Khuôn mặt sau | Chọn diện mạo. Đến bốn mươi tuổi, Đô đốc thành người đàn ông râu ria tuổi bốn mươi |
| 2 | Tên · Họ | Nhập riêng. Nút bên cạnh mỗi ô cho một cái tên khác |
| 3 | Ngày sinh | Định cung hoàng đạo, cộng +6 cho một chỉ số |
| 4 | Tuổi (18–40) | Trẻ hơn thì Sinh lực và Sức mạnh cao hơn; già hơn thì Trí tuệ và Sức hút cao hơn, và nhiều điểm thưởng hơn |
| 5 | Quốc tịch | Bồ Đào Nha (bắt đầu ở Lisboa) · Tây Ban Nha (bắt đầu ở Sevilla) |
| 6 | Nghề nghiệp | Mỗi nghề bắt đầu với kỹ năng khác nhau (bảng dưới) |
| 7 | Độ khó | Dễ · Thường · Luật nghiêm (bảng dưới) |
| 8 | Chỉ số ＋ − | Chia điểm thưởng theo tuổi cho Sinh lực, Trí tuệ, Sức mạnh và Sức hút |
| 9 | Gieo lại | Gieo chỉ số mới |
| 10 | Kỹ năng · Ngôn ngữ ＋ − | Dùng số điểm còn lại cho kỹ năng (17 loại) và ngôn ngữ |
| 11 | Về màn hình tiêu đề | Dừng tạo nhân vật |
| 12 | Sẵn sàng ra khơi | Bắt đầu game như hiện tại |

### Nghề nghiệp và độ khó

- Điểm thưởng theo tuổi: điểm chỉ số 4 + (tuổi − 18) × 0,5, điểm kỹ năng 3 + (tuổi − 18) ÷ 4.
- Điểm thưởng học vấn: từ Trí tuệ 40, cứ mỗi 15 thì +1 điểm kỹ năng (tối đa +3); Trí tuệ 99 trở lên thì +4.

| Nghề nghiệp | Kỹ năng ban đầu |
| --- | --- |
| Nhà thám hiểm | Thuật hàng hải 2 · Trắc địa 2 · Thuật điều tàu 1 |
| Nhà khai quật | Lịch sử 2 · Hùng biện 2 |
| Thợ săn | Thuật điều tàu 3 · Khoa học 1 |
| Kẻ chinh phạt | Kiếm thuật 3 · Pháo thuật 1 |
| Nhà truyền giáo | Thần học 3 · Hùng biện 1 |
| Thương nhân | Kế toán 3 · Hùng biện 1 (tàu đầu tiên: một chiếc Caravel) |
| Binh lính | Pháo thuật 2 · Bắn súng 2 |

| Độ khó | Vào/rời cảng | Tiền ban đầu | Lưu game |
| --- | --- | --- | --- |
| Dễ | 1 ngày | 5.000 đồng vàng | Ở bất cứ đâu |
| Thường | 3 ngày | 3.000 đồng vàng | Ở nhà trọ |
| Luật nghiêm | 10 ngày | 3.000 đồng vàng | Chỉ ở nhà trọ trong các thành của nước nhà |

### Hiển thị · Phông chữ

![Cửa sổ Hiển thị · Phông chữ](guide/p03_display)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Cỡ chữ | MẶC ĐỊNH được đặt hợp với kích thước và mật độ điểm ảnh của màn hình. Cửa sổ và menu to nhỏ theo (chỉ nhớ trên thiết bị này) |
| 2 | Phông chữ | MẶC ĐỊNH là Nanum Myeongjo trên màn hình dày điểm ảnh, Noto Serif trên màn hình thưa hơn |
| 3 | Cách vẽ chữ | Sắc nét (mặc định): vẽ lại chữ theo kích thước thật của màn hình · Cổ điển: kéo giãn cả màn hình |

### Lưu game

- **Lưu tự động** — trong khi chơi, game lưu mỗi phút, xoay vòng qua 5 ô (ghi đè ô cũ nhất trước). Có thể tắt trong Cài đặt.
- **Nhật ký ở nhà trọ** — ở nhà trọ, dùng «Dịch vụ → Ghi nhật ký (Lưu)», hoặc lưu ở nhà riêng; chọn một trong 5 ô.
- Ở độ khó «Luật nghiêm», chỉ có thể ghi nhật ký ở nhà trọ trong các thành của nước nhà.

## Thành phố

### Màn hình thành phố

![Đường phố Lisboa](guide/p04_city)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Ngày · Thành phố · Ngôn ngữ | Ngôn ngữ: đoàn của bạn (kể cả thông dịch viên) nói tiếng của thành này tốt đến đâu ●○○ |
| 2 | Vĩ độ · Kinh độ | Luôn hiện trong thành phố |
| 3 | Lương thực · Nước · Mệt mỏi | Lương thực và nước tính bằng số ngày còn lại. Dưới 7 ngày là «Thiếu», dưới 3 là «Nguy cấp» |
| 4 | Hợp đồng | Số ngày còn lại. Rê chuột để xem nhà bảo trợ, mục tiêu và hạn chót |
| 5 | Vàng · Danh tiếng · Danh vị | Danh vị: nếu chưa có tước quý tộc, là danh xưng theo danh tiếng |
| 6 | Bảng tên thành phố | Nước cai trị, người đứng đầu, văn hóa, tôn giáo và ngôn ngữ |
| 7 | Việc có thể làm ở đây | Tối đa 6 dòng: hợp đồng cần báo cáo, giao dịch có lời, mức sẵn sàng ra khơi… Bấm vào một dòng để đi đến tòa nhà đó |
| 8 | Danh sách tòa nhà | Bấm vào là Đô đốc đi bộ đến và bước vào. Các phát hiện trong thành (★) cũng nằm ở đây |
| 9 | Đường phố | ←→ đi bộ · Shift chạy · ↑ vào tòa nhà · hoặc chỉ cần bấm vào tòa nhà |
| 10 | Các nút nhật ký | Đô đốc, Hạm đội, Vật phẩm, Phát hiện, Hợp đồng, Ủy thác, Hải đồ, Nhật ký, Sổ tay — mở thẻ tương ứng của Sổ tay hải hành |
| 11 | Cài đặt | Cửa sổ Cài đặt (các trang sau) |

- Vào một tòa nhà mất một ngày.
- Danh vị tăng theo danh tiếng. Bảng dưới đây liệt kê mọi danh xưng từ đầu tiên đến cuối cùng ở 2.000.000 danh tiếng. Nếu có tước quý tộc, tước đó sẽ hiện trước tiên trên thanh trên cùng của thành phố.

{{명성_칭호}}

### Sổ tay hải hành

![Sổ tay hải hành — thẻ Đô đốc](guide/p05_book)

| # | Thẻ | Hiển thị |
| --- | --- | --- |
| 1 | Đô đốc | Tuổi, danh tiếng theo loại, vàng, tiền gửi, tiếng xấu, sức khỏe, tước vị, vũ khí, bạn đời, con cái, chỉ số, kỹ năng, ngôn ngữ |
| 2 | Hạm đội | Kỷ luật, mệt mỏi, số thủy thủ tối thiểu–tối đa, lương thực, nước, hàng hóa, danh sách tàu, tốc độ hạm đội (theo tàu chậm nhất) |
| 3 | Bạn đồng hành | Chỉ số (Sinh lực, Trí tuệ, Sức mạnh, Sức hút), kỹ năng và ngôn ngữ của bạn đồng hành |
| 4 | Người lưu lạc | Những hoa tiêu bạn có tin tức, và nơi họ ở lúc bạn nghe tin |
| 5 | Hành trang | Tối đa 40 ô — trang bị, vứt bỏ, đọc |
| 6 | Phát hiện | Số đã tìm, % hải đồ đã vẽ, thẻ theo loại (đã báo cáo, đã công bố, chưa báo cáo, đối thủ) |
| 7 | Manh mối | Các manh mối đã thu thập |
| 8 | Thành tựu | Thành tựu |
| 9 | Hợp đồng | Hợp đồng với nhà bảo trợ và ủy thác của phường hội |
| 10 | Sổ giao thương | Giá cả ghi lại ở các thành đã ghé, nhu cầu của thời đại |
| 11 | Thời cuộc châu Âu | Quan hệ giữa các nước châu Âu |
| 12 | Hải đồ | Các vùng biển đã khám phá, kinh nghiệm tuyến đường |
| 13 | Nhật ký | Các mục theo ngày (mới nhất trước) |

- Khi nghe tin về nơi ở của một người lưu lạc ở quán rượu, người đó sẽ ở lại cảng ấy 59 ngày. Nghe lại tin về cùng người đó không kéo dài thêm; bạn được báo số ngày còn lại, đã trừ đi số ngày đã trôi qua. Thẻ «Người lưu lạc» cũng hiện số ngày lưu lại còn lại.
- Thẻ «Người lưu lạc» chỉ liệt kê những hoa tiêu bạn đã gặp tận mặt, nghe tin, hoặc từng cùng ra khơi. Nơi hiển thị là nơi họ ở lúc bạn nghe tin, nên thời gian trôi qua sẽ mờ dần thành «trước đây ở ○○».
- Nếu nhờ cô phục vụ quán rượu «Tìm nơi ở của một hoa tiêu» và nói đúng tên một hoa tiêu bạn đã gặp hoặc biết, cô ấy sẽ hỏi thủy thủ xung quanh và tìm ra nơi người đó đang ở, trừ khi quá xa. Một thời gian sau, ghé lại cô ấy để nghe tin.
- Khi Đô đốc già đi, hoặc các thuộc hạ đi biển cùng lâu năm, có thể có người qua đời, đổ bệnh hoặc rời tàu vì lý do khác. Thuốc trong khoang, thầy thuốc trên tàu hay thầy thuốc ở cảng đôi khi cứu được họ.

### Cài đặt

![Cửa sổ Cài đặt](guide/p06_settings)

| # | Mục | Chức năng |
| --- | --- | --- |
| 1 | Độ khó | Độ khó hiện tại và nơi có thể lưu game |
| 2 | Hiệu ứng âm thanh · Nhạc | Âm lượng |
| 3 | Toàn màn hình | Chế độ toàn màn hình riêng của game. F11 cũng bật/tắt được |
| 4 | Chất lượng | Nhanh · Thường |
| 5 | Cỡ chữ | Giống «Hiển thị · Phông chữ» |
| 6 | Phông chữ | Giống «Hiển thị · Phông chữ» |
| 7 | Cách vẽ chữ | Giống «Hiển thị · Phông chữ» |
| 8 | Lưu tự động | Bật · Tắt |
| 9 | Rung và chớp sáng khi hải chiến | Bật · Tắt |

### Cài đặt (tiếp)

Cuộn cửa sổ xuống để xem thêm:

| Mục | Chức năng |
| --- | --- |
| Thủy thủ bàn tán khi có phát hiện | Bật · Tắt |
| Phím mũi tên trên biển | Theo phương hướng (↑B ↓N ←T →Đ) / Tự cầm lái (giữ ↑ để tiến · ←→ xoay mũi tàu · ↓ dừng) |
| Đi theo chuột | Bật: sau một lần bấm, tàu xoay theo hướng chuột di chuyển · Tắt: đi đến chỗ đã bấm |
| Độ nhạy điều khiển | Chậm · Thường · Nhanh — tốc độ xoay khi dùng chuột hoặc phím mũi tên |
| Thông báo cảng và cổng thành | Chỉ thông báo · Chỉ hỏi khi đang dừng · Luôn hỏi |
| Cài đặt bàn phím | Bấm vào một mục rồi nhấn phím mới. Nếu phím đã được dùng, hai mục sẽ đổi phím cho nhau |

## Các tòa nhà

### Bến cảng

![Bến cảng](guide/p10_harbor)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Chuẩn bị ra khơi | Thủy thủ, sửa chữa, lương thực, nước và vật liệu sửa chữa cùng lúc (trang sau) |
| 2 | Ra khơi | Ra biển. Nếu đã thuộc tuyến đường, sẽ có thêm «Ra khơi bằng tự động hải hành» |
| 3 | Tiếp tế | Đặt riêng lương thực và nước (theo ngày) và vật liệu sửa chữa (theo thùng). Giảm bớt thì bán lại 50% giá tiếp tế |
| 4 | Tổ chức hạm đội | Tối đa 5 tàu; tàu trên cùng là kỳ hạm. Đổi kỳ hạm, số người mỗi tàu (tự động), đưa tàu từ bến neo vào, để tàu ở bến neo, phá dỡ |
| 5 | Tin tức thành phố | Mua vị trí của một thành phố chưa biết và đánh dấu lên hải đồ (40 + cỡ thành × 20 đồng vàng mỗi thành) |
| 6 | Công bố phát hiện | Báo cho thế giới điều bạn đã tìm thấy — chỉ được danh tiếng (mờ đi nếu không có gì để công bố) |

- Không thể ra khơi khi: không có tàu · dưới 5 thủy thủ, hoặc ít hơn 1/3 số thủy thủ tối thiểu · lương thực hoặc nước dưới 2 ngày.
- Các cảng trên vùng biển gió mùa còn có mục «Tình hình gió mùa».
- «Bến neo»: để tàu đã tách khỏi hạm đội ở đây. Bến neo cảng nhà chứa tối đa 10 tàu không giới hạn thời gian; bến neo các cảng khác chứa tối đa 3 tàu, và tàu sẽ bị phá dỡ sau 2 năm (có cảnh báo khi còn 90 và 30 ngày). Cũng có thể đổi kỳ hạm ở xưởng đóng tàu.

### Chuẩn bị ra khơi

![Cửa sổ Chuẩn bị ra khơi](guide/p11_prep)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Ghi chú | Tình hình của cảng này, như bệnh scorbut và tuyến tự động hải hành |
| 2 | − ＋ / Số ngày | Chuẩn bị cho hải trình bao nhiêu ngày |
| 3 | 20 ngày · 40 ngày · 60 ngày · Tối đa | Nút nhanh. Nếu có hợp đồng, sẽ có thêm «Đến mục tiêu» và «Khứ hồi» |
| 4 | Chi phí | Số tiền cần trả |
| 5 | Xác nhận | Bổ sung thủy thủ đến mức tối thiểu + 4, sửa chữa (nếu có xưởng đóng tàu), và chất lương thực, nước, vật liệu (6 thùng + 3 thùng mỗi tàu) |

### Thương điếm

![Thương điếm](guide/p12_trade)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Mua | Mua hàng hóa (trang sau) |
| 2 | Bán | Bán hàng hóa — hàng mua ở thương điếm này không thể bán lại ở đây với giá cao hơn giá đã mua |
| 3 | Đầu tư | «Đầu tư vào thương điếm». Từ 1.000 đồng vàng; không hoàn lại |
| 4 | Trò chuyện | Mỗi lần ghé một lần — biến động thị trường, mốt thời thượng, bí quyết buôn bán, manh mối |
| 5 | Thời giá | Giá theo nhóm hàng (100% = bình thường), giá thị trường, và sổ giá của các thành khác |
| 6 | Mặc cả | Nếu thành công, giá mua giảm (tối đa 25%). Có kế toán viên thì có thêm «Mặc cả gắt» |

- Các bậc đầu tư: 4.000 · 12.000 · 30.000 · 70.000 · 150.000 đồng vàng. Mỗi bậc làm giá mua rẻ hơn 3%, giá bán cao hơn 3%, và tiếp tế rẻ hơn 6%. Cổ tức mỗi 90 ngày.
- Số lần mặc cả mỗi ngày: Kế toán bậc 0 một lần · bậc 1–2 hai lần · bậc 3 ba lần, +1 nếu có kế toán viên. Thất bại nếu hoàn toàn không nói được ngôn ngữ ở đó.
- Kế toán bậc 3 thì xuất hiện «Chợ đen hẻm sau».

### Thương điếm — Cửa sổ mua

![Cửa sổ mua](guide/p13_trade_buy)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Ô đánh dấu | Chọn nhiều món hàng rồi mua một lượt (bấm vào một dòng thì chỉ mua món đó) |
| 2 | Nhãn | Đặc sản ×N · Trung chuyển · Thời thượng · Thời đại ▲▼ |
| 3 | Giá · Tồn kho | Giá mỗi thùng và lượng còn lại |
| 4 | Giá tốt nhất đã biết · Lời mỗi thùng | Nơi giá cao nhất ghi trong sổ giá, và tiền lời mỗi thùng |
| 5 | Chỗ trống | Chỗ còn trong khoang (thùng), trọng lượng, số loại hàng |
| 6 | Mua mục đã chọn | Mua một lượt mọi món đã đánh dấu |

### Xưởng đóng tàu

![Xưởng đóng tàu](guide/p14_shipyard)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Mua | Tàu của vùng này. Tàu vượt quá bậc đóng tàu của xưởng sẽ bị khóa |
| 2 | Bán | Không bán được kỳ hạm hoặc tàu đi mượn |
| 3 | Sửa chữa | «Sửa tất cả» hoặc từng tàu một |
| 4 | Cải tạo | Đại bác · buồm (300 đồng vàng mỗi lần) · nâng cấp dây buồm · thêm lỗ pháo (250 đồng vàng mỗi cái) · tượng mũi tàu (150 đồng vàng) · đóng lại thân tàu · đổi tên · cải tạo khoang (chỉ kỳ hạm). «Cải tạo nhiều tàu cùng lúc» ở trên cùng làm buồm, đại bác và dây buồm cho các tàu đã chọn một lượt |
| 5 | Đầu tư đóng tàu | Theo đơn vị 1.000 đồng vàng. Mỗi khi tổng đầu tư đạt 10.000 · 30.000 · 70.000 đồng vàng, bậc đóng tàu tăng một (tối đa 5) |

- Nâng cấp dây buồm (để đi ngược gió): lắp buồm tam giác mũi → cắt lại buồm và dây tốt hơn → gia cố sống tàu. Tốn 8%, 12% và 16% giá tàu, cần bậc đóng tàu 1, 3 và 4.
- Đại bác và tượng mũi tàu mở khóa đến bậc đóng tàu của xưởng. Loại cao bậc hơn sẽ hiện bị khóa; nâng bậc bằng «Đầu tư đóng tàu» để lắp.

#### Hiệu quả của tượng mũi tàu

| Hiệu quả | Tác dụng thực tế |
| --- | --- |
| Tốc độ | +% tốc độ cho tàu mang tượng đó (chỉ tàu đó) |
| Thân tàu | −% thiệt hại do pháo kích trong hải chiến và do bão |
| Bão | −(3×)% khả năng gặp bão (tối đa −65%) · −(2×)% thiệt hại do bão (tối đa −30%) |
| Thủy quái | Thủy quái rút lui với xác suất đó · −% thiệt hại do thủy quái (tối đa −50%) |
| Chiến đấu | +% độ chính xác pháo của ta |
| May mắn | +(2×) điểm phần trăm để vượt qua sự kiện trên biển (tàu ma, núi băng, bãi cạn, sốt, tiên cá) bình an vô sự |
| Kỷ luật | +(2×) kỷ luật mỗi ngày trên biển — tượng Ma vương thì làm giảm |

- Nếu nhiều tàu mang tượng mũi tàu, mỗi hiệu quả thì tượng mạnh nhất được tính đủ, các tượng khác chỉ cộng thêm ¼. Tổng hiện tại xem ở mục «Hiệu quả tượng mũi tàu» cuối cửa sổ «Hạm đội».
- Tượng mũi tàu hình thần thú (tiên nữ, kỳ lân phương Tây, sư tử đầu chim, ngựa có cánh, tiên cá, Triton, kỳ lân, rồng, phượng hoàng, Garuda) không bán ở xưởng đóng tàu. Chỉ có được như thánh tích của những phát hiện lớn như Avalon, Kỳ lân một sừng, Persepolis, Parthenon, Troia, Atlantis, Kỳ lân, Hắc long, Thánh Sophia ở Kyiv và Prambanan.
- ★ 7 tượng mũi tàu huyền thoại được trục vớt khi đánh bại các thủy quái huyền thoại (Leviathan, Bakunawa, Zaratan, Jörmungandr, Isonade, Cipactli, Tàu ma). Mỗi tượng có «sức mạnh huyền thoại» mà tượng khác không có — Biển lặng (bão giảm đến −88%) · Vòng tay của Mẹ (tổn thất thủy thủ giảm một nửa) · Vỏ sò chữa lành (1% thân tàu mỗi ngày) · Lời thì thầm từ tận cùng thế giới (một manh mối mỗi 30 ngày) · Đuôi kéo (thưởng tốc độ áp dụng cho mọi tàu trong hạm đội) · Pháo thủ run rẩy (độ chính xác của địch −12%) · Lời nguyền (tượng Ma vương — bị chặn bởi tượng Thiên thần, Đức Mẹ, Thánh Michael và Thánh Nicholas).
- Nếu tháo tượng thánh tích hoặc tượng huyền thoại, hoặc bán hay phá dỡ tàu mang nó, tượng sẽ trở về hành trang.

### Quán rượu

![Quán rượu](guide/p15_tavern)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Uống rượu | 4 + cỡ thành × 2 đồng vàng, mệt mỏi −4. Từ ly thứ 4 có thể say gục |
| 2 | Mời cả quán | Kỷ luật +12, mệt mỏi −15, trung thành của mọi thuộc hạ +3, danh tiếng giao tế +1 |
| 3 | Nghe chuyện buôn bán | Giá một ly rượu, hai lần mỗi ngày |
| 4 | Nghe ngóng tin tức | Chỉ khi có hợp đồng — hỏi về mục tiêu của hợp đồng |
| 5 | Nhìn quanh khách khứa | Mỗi lần ghé một lần. Gặp được ai đó, hoặc vướng vào cãi vã |
| 6 | Thuê thủy thủ | Đặt số thủy thủ của hạm đội. Nút nhanh: tối thiểu · đủ để đổi ca (tối thiểu × 1,3) · tối đa |
| 7 | Tìm hoa tiêu | Danh sách hoa tiêu đang lưu lại thành này (trang sau) |
| 8 | Nói chuyện với cô hầu bàn | Chỉ ở thành có cô hầu bàn |
| 9 | Rủ chơi poker | Tiền cược 100 · 500 · 1.000 · 5.000 đồng vàng |
| 10 | Bố trí thuộc hạ | Chức vụ của thuộc hạ và các khoang trên kỳ hạm |
| 11 | Nói chuyện với thuộc hạ | Ngồi xuống cùng một thuộc hạ (chỉ tặng quà cho thuộc hạ khác giới) |

### Tìm hoa tiêu

![Danh sách hoa tiêu](guide/p16_hire)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Danh sách | Tên, tóm tắt kỹ năng, danh tiếng cần có. Nhà thám hiểm đối thủ thì «Không thuê được» |
| 2 | Thẻ hồ sơ | Xuất thân, nơi đang ở, năm sinh và năm mất, lời giới thiệu |
| 3 | Chỉ số | Sinh lực, Trí tuệ, Sức mạnh, Sức hút |
| 4 | Kỹ năng | Bậc ●●● (tối đa 3) |
| 5 | Ngôn ngữ | Các ngôn ngữ họ nói và mức nói chuyện được với đoàn của bạn |
| 6 | Nút thuê | Cần đủ danh tiếng yêu cầu và ít nhất một ngôn ngữ chung |

- Trung thành ban đầu = 40 + bậc ngôn ngữ chung × 10. Lương trả mỗi tháng.

### Nhà trọ

![Nhà trọ](guide/p17_inn)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Nghỉ trọ | 8 + 6 × cỡ thành đồng vàng mỗi đêm, 1–60 đêm. Mệt mỏi về 0, sức khỏe +30 mỗi đêm |
| 2 | Tìm hoa tiêu | Chủ nhà trọ giới thiệu vài người (không có nhà thám hiểm đối thủ) |
| 3 | Bố trí thuộc hạ | Giống ở quán rượu |
| 4 | Nói chuyện với thuộc hạ | Giống ở quán rượu |
| 5 | Làm việc vặt | Kiếm tiền công và nâng tiếng địa phương. Danh tiếng −1 mỗi ngày. Tổng cộng tối đa 90 ngày |
| 6 | Dịch vụ | Ghi nhật ký (Lưu) · Tải · Cài đặt |

### Chợ

![Chợ](guide/p18_market)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Mua | Vũ khí, giáp, dụng cụ hàng hải, trang sức. Hàng đổi mỗi 45 ngày. Chợ ở cảng nhà luôn có la bàn và kính lục phân |
| 2 | Bán | Thường là 50% giá gốc. Đồ mua ở thành này không bán được với giá cao hơn giá đã mua |
| 3 | Thời giá | Giống cửa sổ thời giá của thương điếm |
| 4 | Hành trang | Thẻ Hành trang (40 ô) |

### Nhà thờ

![Nhà thờ](guide/p19_church)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Quyên góp | Tiếng xấu −1 mỗi 200 đồng vàng. Danh tiếng giao tế = (bậc Thần học + 1) mỗi 1.000 đồng vàng quyên góp |
| 2 | Cầu nguyện | Mỗi lần ghé một lần. Ít bão hơn trong 120 ngày. Thần học bậc 1 trở lên thì kỷ luật +5 |
| 3 | Xin chữa bệnh | Dâng lễ vật: sức khỏe về 100, thủy thủ bệnh về 0 |

### Thư viện

![Thư viện](guide/p20_library)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Xem sách | Chọn một cuốn trên giá và đọc (ảnh tiếp theo) |
| 2 | Tìm kiếm | Thành nào có cuốn sách mà thư viện này không có |

### Thư viện — Giá sách

![Giá sách](guide/p21_shelf)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Chú giải | Đen = đã đọc · Vàng = đọc được ngay · Đỏ = chưa đọc được |
| 2 | Sách màu vàng | Bấm vào hoặc chọn bằng phím mũi tên, rồi Enter để mở |
| 3 | Thông tin giá sách | Số sách, và số sách đọc được ngay |
| 4 | Dòng gợi ý | Hiện tên sách và tác giả khi đến gần một cuốn |

- Đọc một cuốn sách lần đầu mất một ngày. Đoàn của bạn cần có người đọc được ngôn ngữ của sách, và với sách học thuật, cần người hiểu lĩnh vực đó.
- Ngôn ngữ bậc 3 đọc được mọi đoạn, bậc 2 khoảng 70%, bậc 1 khoảng 35%.
- Vì sao sách màu đỏ: chưa xuất bản · chưa đọc xong các cuốn trước trong bộ · thiếu ngôn ngữ hoặc học vấn · viết về vùng đất bạn chưa biết.

### Cung điện · Dinh thự (Nhà bảo trợ)

![Cung điện](guide/p22_palace)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Đề xuất phiêu lưu | Đề xuất một phát hiện bạn có manh mối, và ký hợp đồng. «Xin một việc nhỏ»; nếu đã tìm thấy từ hai phát hiện trở lên, có «Báo cáo tất cả một lượt» |
| 2 | Báo cáo | Chỉ khi đang có hợp đồng với nhà bảo trợ này |
| 3 | Trò chuyện | Sở thích của nhà bảo trợ. Từ 25 tín nhiệm trở lên đôi khi họ cho manh mối hoặc giới thiệu sách |
| 4 | Vương lệnh | Khi quốc vương triệu kiến: nhận một trong 3 vương lệnh (hạn 2 năm) — thành công thì tước vị lên một bậc |
| 5 | Đặc quyền | Cần tước vị của nước đó — Thư cho phép tàu tư nhân (hải tặc tấn công ít hơn 80%) · Miễn thuế |

- Quốc vương triệu kiến mỗi khi tổng danh tiếng của bạn tăng thêm 10.000.
- **Báo cáo hải đồ** (chỉ nhà bảo trợ là vua và học giả): nhận vàng và danh tiếng thám hiểm theo phần hải đồ mới vẽ thêm kể từ lần báo cáo trước. Vua trả nhiều vàng hơn; học giả cho nhiều danh tiếng hơn, và với hải đồ lớn sẽ cho một manh mối về vùng biển đó. Nhà bảo trợ am hiểu địa lý cho thêm +20%.
  - Hải đồ chi tiết dần mỗi lần đi qua cùng một nơi — ① đường viền → ② sông → ③ núi → ④ địa hình. Mỗi ô trị giá ① 1 · ② 2,5 · ③ 4,5 · ④ 7,5, nên càng chi tiết càng được nhiều.
  - Có phòng bản đồ (Trắc địa★, Vẽ☆), đài quan sát của kỳ hạm, và thuộc hạ giỏi Trắc địa ở đài quan sát của các tàu khác thì một lần đi qua sẽ vẽ được chi tiết hơn (tốc độ vẽ bản đồ, tối đa +150%).

### Khi danh tiếng chưa đủ

- Nếu danh tiếng chưa đủ cao, quản gia sẽ từ chối bạn. Dù vậy vẫn có thể «Hỏi xem chủ nhân có việc nhỏ nào không» và nhận một việc nhỏ (vẽ hải đồ, thu mua hàng, xác minh tin đồn).

![Khi danh tiếng chưa đủ — quản gia](guide/p23_butler)

![Một việc nhỏ](guide/p24_errand)

### Phường hội

![Phường hội](guide/p25_guild)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Xem ủy thác | Các ủy thác trên bảng. Tối đa 3 việc cùng lúc |
| 2 | Báo cáo ủy thác | Các ủy thác đã hoàn thành |
| 3 | Ủy thác đã nhận | Tiến độ |
| 4 | Rèn kỹ năng | (bậc+1) × 1.500 đồng vàng, (bậc+1) × 10 ngày. Trí tuệ càng cao càng dễ thành công |
| 5 | Học ngôn ngữ | Ngôn ngữ của thành này và các vùng lân cận. (bậc+1) × 1.000 đồng vàng, (bậc+1) × 15 ngày |

- Nếu hoàn thành trong thời gian gia hạn sau hạn chót, nhận một nửa tiền thưởng và danh tiếng. Bỏ ngang thì danh tiếng −(danh tiếng của ủy thác × 1,5).

### Cổng thành

![Cổng thành](guide/p26_gate)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Lên đường thám hiểm | Từ 5 thủy thủ trở lên. Nếu chọn thú cưỡi, chuẩn bị mất 10 ngày |
| 2 | Chuồng thú | Mua, gửi chuồng hoặc bán lại thú cưỡi (trang sau) |

### Cổng thành — Chuồng thú

![Chuồng thú](guide/p27_stable)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Thẻ thú cưỡi | Giá, số người chở được, tốc độ theo địa hình |
| 2 | Độ hợp địa hình | ◎ rất tốt · ○ tốt · △ khá hơn chút · × kém |
| 3 | Chú giải | Nếu thiếu thú, hiệu quả giảm tương ứng |
| 4 | Mua và gửi chuồng | Mua thú đã chọn đủ cho cả đoàn và gửi ở chuồng |

| Thú cưỡi | Giá | Địa hình mạnh (hệ số tốc độ) |
| --- | --- | --- |
| Phu khuân vác | 25 (tiền công) | Rừng rậm 1,3 · Rừng 1,25 |
| Lừa | 60 | Núi 1,5 · Đồng cỏ/Thảo nguyên 1,4 |
| Ngựa | 180 | Thảo nguyên 2,4 · Đồng cỏ 2,2 |
| Xe ngựa | 450 | Đồng cỏ 2,8 · Thảo nguyên 2,6 |
| Lạc đà | 160 | Sa mạc 3,0 |
| Lạc đà không bướu | 45 | Núi 2,4 · Bãi tuyết 1,9 |
| Voi | 1.200 | Rừng rậm 2,2 · Rừng 2,0 |
| Xe trượt tuần lộc | 90 | Lãnh nguyên 3,0 · Bãi tuyết 2,8 · Đồng băng 2,6 |
| Bò Tây Tạng | 80 | Bãi tuyết 2,4 · Núi 2,2 |

Thú cưỡi nào được bán tùy vào văn hóa của thành và năm.

### Nhà hàng · Tư gia

| Tòa nhà | Nút | Chức năng |
| --- | --- | --- |
| Nhà hàng | Xem thực đơn | Mỗi thành một bữa mỗi ngày. Món hạng 1/2/3: mệt mỏi −6/−8/−10, sức khỏe +1/+2/+3, kỷ luật +2/+3/+4 |
| Tư gia | Nghỉ ngơi | Trôi qua 3 ngày; sức khỏe về 100, mệt mỏi về 0 |
| Tư gia | Ghi nhật ký (Lưu) | Lưu game |
| Tư gia | Két sắt | Gửi và rút tiền. Lãi 0,3% mỗi tháng |
| Tư gia | Nhà kho | Cất đồ mà không tốn ô hành trang (trừ bằng chứng của phát hiện chưa báo cáo hoặc chưa công bố). Lọc bằng các nút loại; «Cất tất cả» bỏ qua đồ đang trang bị, đồ đã ghim và dụng cụ hàng hải |
| Tư gia | Nghỉ hưu | Nghỉ hưu |
| Tư gia | Mở dạ hội | Nếu có tước vị. Mỗi 90 ngày một lần, 3.000 đồng vàng + 1.500 mỗi bậc tước vị. Danh tiếng giao tế |
| Tư gia | Chuẩn bị ra mắt | Cho con gái từ mười lăm đến mười bảy tuổi. Váy dạ hội giá 2.000 · 6.000 · 15.000 đồng vàng. Nếu cô thành «Đóa hoa của giới thượng lưu», lời cầu hôn từ hoàng gia sẽ dễ đến hơn vào lễ cưới năm mười tám tuổi |

**Dạ hội** — Khi đã là quý tộc, bạn có thể mở dạ hội ở tư gia. Các mỹ nhân trong «Phòng tranh mỹ nhân» của Ludwig I và các nữ đại công tước nhà Habsburg đến làm khách, sớm hơn thời của họ một chút (Maria Theresa · Maria Antonia · Marie xứ Bayern · Auguste xứ Toscana · Caroline von Holnstein · Amalie von Schintling · Friederike von Gumppenberg · Alexandra xứ Đan Mạch · Lola Montez · Jane Digby · Marianna Florenzi · Helene Sedlmayr).

- Một tiểu thư sẽ đến gần Đô đốc hoặc người con trai đã trưởng thành. Tiếp cận cô qua điều cô thích — khiêu vũ, chuyện biển cả, chính trị và học vấn, hay âm nhạc — thì thiện cảm tăng mạnh. Bạn cũng có thể giới thiệu con trai và hướng cô sang cậu ấy.
- Khi thiện cảm đạt 100, cô sẽ cầu hôn — với Đô đốc còn độc thân thì làm vợ, với Đô đốc đã có vợ thì làm vợ hai (có nhà ở quê cô), hoặc với con trai thì làm cô dâu (thành vợ chính nếu cậu ấy kế vị). Hoàng tộc mang theo của hồi môn 40.000 đồng vàng, quý tộc 15.000.
- Ghen tị và đố kỵ: mỗi tiểu thư có một đối thủ, ưu ái người này sẽ khiến đối thủ ghen. Khi cơn ghen tích tụ, đối thủ sẽ bày mưu: đồn đại (danh tiếng giao tế −), mách lẻo (tín nhiệm của quốc vương nước đó −), làm đổ rượu (thiện cảm của tình địch −), hoặc dỗi hờn. Vợ bạn cũng ghen.
- Chính trị: ưu ái một tiểu thư thì tín nhiệm với quốc vương nước cô +2, cưới cô +20, từ chối lời cầu hôn −10, và cưới cô thì −10 với nước của tình địch.
- Mụ phù thủy không mời mà đến: Griselda, Phù thủy Cây kế, xông vào. Mời mụ khiêu vũ, xin lỗi và mời ngồi ghế danh dự, hoặc gây ấn tượng bằng cách cầm kiếm đối mặt, thì mụ sẽ theo bạn làm bạn đồng hành (mụ cũng gia nhập hội phù thủy trên tàu). Gọi lính đuổi mụ ra thì dạ hội tan tành.


**Con cái** — Gặp con cái ở mục «Gia đình» trong tư gia để dạy dỗ, chơi đùa, và đưa chúng lên tàu làm học việc.

- **Tư chất bẩm sinh** — May rủi quyết định mỗi đứa trẻ có thể phát triển mỗi chỉ số đến đâu (chỉ số ban đầu + 6 đến 26, rộng rãi hơn với năng khiếu bẩm sinh). Dưới mức trần đó chúng lớn nhanh, nhưng chạm trần rồi thì hầu như không tăng nữa. Cùng một cách dạy, mỗi đứa lớn khác nhau.
- **Kỹ năng** — Không phải năm nào cũng có gia sư. Bậc càng cao càng khó, Trí tuệ càng cao học càng giỏi, và trước tuổi trưởng thành (16) trẻ chỉ đạt tối đa bậc 2. Bậc 3 phải học khi đã lớn, trong khoang tàu hoặc ở phường hội.
- **Vận may mỗi năm** (6–15 tuổi) — Vào «năm tốt», một chỉ số được +1 bất kể tư chất; vào «năm khó» (sốt, ương bướng) năm đó không tự lớn lên.
- **Ngôn ngữ và kỹ năng của mẹ** — Mỗi năm, đứa trẻ có thể học từ người mẹ sống cùng một ngôn ngữ và một kỹ năng (đến bậc của mẹ). Người mẹ từng là cô hầu bàn nói tiếng quê mình (thông thạo) và một ngôn ngữ phổ biến ở vùng đó (bình thường), và có một hai kỹ năng (bậc 1–2) trong Hùng biện, Nấu ăn, Âm nhạc và Kế toán. Người mẹ từng là thuộc hạ thì có ngôn ngữ và kỹ năng của chính người đó. Đứa trẻ ở trên tàu thì không học được từ mẹ.
- **Cùng ra khơi** — Con trai đã lớn và con gái chưa chồng có thể gia nhập hạm đội làm hoa tiêu qua «Gia đình» → «Đưa lên tàu». Bạn bố trí khoang, chức vụ, thậm chí giao làm thuyền trưởng tàu khác như mọi thuộc hạ; chúng nhận nửa lương, và trung thành tùy vào quan hệ với cha. Trẻ lên tàu làm học việc tự động thành hoa tiêu chính thức khi mười sáu tuổi. Kỹ năng và ngôn ngữ học trên tàu vẫn giữ nguyên, và «Cho ở nhà» hoặc cho thôi việc thì đứa trẻ về nhà (có thể đưa lên tàu lại).
- **Con trai ngoài ba mươi rời nhà** — Con trai không ở trên tàu, khi đã quá ba mươi, sẽ ra đi tìm đường riêng khi bạn ghé tư gia (thành thuyền trưởng tàu buôn, học giả đại học, hiệp sĩ của một quốc vương nào đó, hoặc thương nhân ở cảng, tùy chỉ số nổi bật nhất). Bạn có thể cho tiền lộ phí, chúc phúc, hoặc nói «Vậy thì lên tàu của ta» mà cùng ra khơi. Nếu không bao giờ ghé, đến ba mươi ba tuổi cậu sẽ để lại thư rồi đi. Con trai đã rời nhà **vẫn có thể kế vị** (có thể chọn cậu khi nghỉ hưu; cậu sẽ trở về nếu kế vị), mỗi năm vợ bạn sẽ chuyển thư của cậu, và bạn có thể gọi cậu về bằng «Hãy đến tàu của ta».
- **Kế vị** — Con trai đang ở trên tàu sẽ rời hạm đội để làm Đô đốc, các anh em khác trên tàu ở lại làm hoa tiêu dưới quyền người em.

### Bảo tàng hoàng gia — Hiến tặng

Hoàn thành vương lệnh về bảo tàng, phòng tranh hoặc vườn thú thì Bảo tàng, Phòng tranh hoặc Vườn thú hoàng gia sẽ được dựng ở thành của quốc vương đó. Vào trong để xem những gì đã hiến tặng, và **hiến tặng** thêm đồ mới.

![Hiến tặng cho bảo tàng](guide/p27_museum)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Ghi chú | Đồ đã hiến tặng sẽ rời hành trang và được trưng bày trong phòng trưng bày |
| 2 | Thánh tích phát hiện | Có thể hiến tặng cho bảo tàng |
| 3 | Kiệt tác | Tranh và tượng từ xưởng vẽ và phòng điêu khắc — bảo tàng và phòng tranh |
| 4 | Giá trị | Giá trị của món đồ (bạn không nhận được tiền) |

- Mỗi món (hoặc mỗi loài, với động vật) cho danh tiếng giao tế +75 và tín nhiệm của quốc vương nước đó +1. Với vườn thú, bạn hiến tặng những loài động vật quý hiếm mới tìm thấy.

## Hải hành

### Màn hình biển — Thanh trên và các bảng

![Màn hình biển](guide/p30_sea)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Vĩ độ · Kinh độ | Vĩ độ cần thiên bàn hoặc kính lục phân, hoặc Trắc địa 2; kinh độ cần kính lục phân (nếu không thì «?») |
| 2 | Hải hành · Lương thực · Nước · Thủy thủ · Mệt mỏi | Số ngày từ lúc xuất phát và tiếp tế còn lại |
| 3 | Hợp đồng | Số ngày còn lại, ✓ khi đã tìm thấy |
| 4 | Dòng trạng thái | Việc đang làm, gió ngược, còn khoảng n ngày đến nơi / n ngày tiếp tế, tên vùng biển, tốc độ |
| 5 | Hải đồ thu nhỏ | Lấy tàu làm tâm, rộng 40° kinh độ. Bấm vào để mở cửa sổ hải đồ |
| 6 | Bảng gió | Hướng gió, sức gió (●1–5), gió xuôi/gió ngang/gió ngược, mây |

### Màn hình biển — Các nút bên dưới

![Màn hình biển](guide/p30_sea)

| # | Nút | Chức năng |
| --- | --- | --- |
| 7 | Dừng / Đi | Cuộn buồm dừng lại — tuyến đường được giữ, bấm Đi để đi tiếp |
| 8 | Tìm kiếm | Chỉ khi đang dừng. Mất một ngày tìm kiếm rộng khắp xung quanh |
| 9 | ×0,5 ×1 ×2 ×4 | Tốc độ game. Ở ×1 một ngày = 1,25 giây thực |
| 10 | Vào ○○ | Khi có cảng đã biết trong vòng 0,55° |
| 11 | Lên bờ | Đất liền trong vòng 0,4° và có từ 5 thủy thủ — cả đoàn lên bờ thành đội thám hiểm |
| 12 | Câu cá | Câu cá (các trang sau) |
| 13 | Hải đồ | Cửa sổ hải đồ (M) |
| 14 | Sổ tay | Sổ tay hải hành |
| 15 | Đi theo chuột | Bật/tắt (Shift) |
| 16 | ＋ − | Phóng to và thu nhỏ (con lăn cũng được) |
| 17 | Cài đặt | Cửa sổ Cài đặt |

Thời gian vẫn trôi ngay cả khi đang dừng — ngày tháng qua đi, lương thực và nước vơi dần, và các tàu khác vẫn di chuyển.

### Phím trên biển

| Phím | Chức năng |
| --- | --- |
| ↑ ↓ ← → | Mũi tàu xoay về hướng đó; thả ra thì đi thẳng theo hướng ấy (hai phím = hướng chéo) |
| Space | Dừng. Nếu đang dừng cạnh một cảng thì vào cảng |
| Enter | Vào cảng |
| Bàn phím số 1–9 | Tám hướng la bàn; 5 là dừng |
| ` · 1 · 2 · 3 | Tốc độ ×0,5 · ×1 · ×2 · ×4 |
| M · L · F | Hải đồ · Lên bờ · Câu cá |
| ＋ − | Phóng to · Thu nhỏ |
| Shift | Bật/tắt đi theo chuột |
| Chuột phải | Xóa điểm đến |
| Bấm chuột | Biển = đi về hướng đó · Thành phố = đến cảng đó · «?» hoặc di tích = đi về hướng đó · Tàu khác = tiến lại gần |

- Bảng gió: góc giữa mũi tàu và gió dưới 45° là «Gió xuôi», dưới 110° là «Gió ngang», dưới 150° là «Gió ngược chếch», và lớn hơn nữa là «Gió ngược».
- Giữ mũi tàu trong khoảng ±18° so với hướng mây trôi để được trọn gió xuôi theo đường mây (tối đa +8%, khác nhau tùy vùng biển).

### Hải đồ (M)

![Cửa sổ hải đồ](guide/p31_chart)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | ＋ − | Phóng to và thu nhỏ (con lăn, kéo và nhấp đúp cũng được) |
| 2 | Toàn bộ | Toàn thế giới |
| 3 | Ở đây | Về vị trí hiện tại |
| 4 | Chú giải | ⚑ thủ đô · cỡ mô hình lớn/vừa/nhỏ · góc xanh ngọc = có tự động hải hành · màu gạch dưới = nước cai trị · hình thoi vàng = nhà bảo trợ · cờ đỏ = nhà bảo trợ đã ký hợp đồng · chấm xanh đậm = vị trí của bạn |
| 5 | Thành phố · Biển | Bấm vào thành phố để xem tóm tắt và nút «Tự động hải hành đến ○○» · bấm vào biển để có «Đi đến đây» |
| 6 | Dòng gợi ý | Tóm tắt cách điều khiển |

- **Cách mở tự động hải hành**: đi từ cảng A thẳng vào cảng B mà không ghé nơi nào khác, tuyến A–B sẽ mở theo cả hai chiều.
- Nếu chạm phím mũi tên, bàn phím số hoặc bấm vào biển trong khi tự động hải hành, chế độ này sẽ tắt và không dùng lại được trong chuyến đi đó.

### Hải tặc và các tàu khác

![Gặp hải tặc](guide/p32_pirate)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Chiến đấu | Hải chiến |
| 2 | Bỏ chạy (khoảng n%) | Tỉ lệ thành công 0,35 + (tốc độ hạm đội ta − tốc độ hải tặc) × 0,5 + Thuật hàng hải × 0,08 (10–90%). Thất bại thì hải chiến |
| 3 | Nộp tiền mãi lộ | 200 đồng vàng + 8% số vàng của bạn. Không đủ tiền thì hải chiến |
| 4 | Van xin | Chỉ khi vàng + két sắt + giá trị hàng hóa từ 10.000 trở xuống — hải tặc cho đi qua |

- Tiến lại gần tàu không thù địch thì có thể chọn «Hỏi tin tức» (manh mối hoặc giá cả), «Mua lương thực và nước» (chỉ tàu buôn, 4 đồng vàng mỗi thùng), «Tấn công»… Tấn công tàu buôn hoặc hạm đội sẽ làm tăng tiếng xấu.
- Thư cho phép tàu tư nhân từ cung điện làm hải tặc tấn công ít hơn 80%.

### Hải tặc nổi tiếng · Lệnh truy nã · Cờ hải tặc

- Ở mỗi vùng biển, những hải tặc nổi tiếng trong lịch sử và hải tặc trong lời đồn chỉ huy băng hải tặc riêng (hiếm khi xuất hiện giữa các băng hải tặc).
- **Nhà hàng «Xem lệnh truy nã»**: lệnh truy nã những hải tặc nổi tiếng đang hoạt động ở vùng biển của thành đó. Bấm vào một tờ để xem cận cảnh chân dung, băng nhóm, cờ và tiền thưởng. Đánh bại hạm đội của hải tặc đó rồi **«Nhận tiền thưởng»** ở nhà hàng của bất kỳ cảng nào.
- **Tin đồn hải tặc**: Nhà hàng «Nghe khách kể chuyện hải tặc» (mỗi lần ghé một lần, miễn phí, hạn ngắn) · Cô hầu bàn ở quán rượu «Trả tiền hỏi tin → Tin đồn về hải tặc nổi tiếng» (mất phí, hạn rộng rãi). Đến vùng biển đã nghe trong thời hạn thì hạm đội của hải tặc đó thật sự xuất hiện. Được ghi vào mục «Việc cần làm» trong sổ tay.
- **Cờ hải tặc**: mỗi băng hải tặc có một lá cờ — bạn nhận được lần đầu đánh bại một hải tặc của băng đó (loại hành trang «Cờ hải tặc»). Chiếm được sào huyệt hải tặc thì cũng có cờ của băng giữ sào huyệt. Số cờ đã thu thập hiện ở mục «Sào huyệt hải tặc» trong sổ tay.
- Đánh bại ba hải tặc nổi tiếng khác nhau ở cùng một vùng biển thì sào huyệt hải tặc sẽ lộ ra. Tin đồn sẽ cho biết trước về những hải tặc chưa được tính.
- **Thu nạp**: khi bạn đánh bại một hải tặc nổi tiếng, tàn quân của hắn dồn sang một hải tặc nổi tiếng khác trong cùng vùng biển (ưu tiên cùng băng, mỗi hải tặc tối đa hai lần). Hải tặc đã bị thu nạp không xuất hiện nữa; hải tặc thu nạp được thêm một tàu cho mỗi lần thu nạp, thủy thủ và pháo thuật mạnh hơn, và tiền thưởng cao hơn. Lệnh truy nã ghi «Đã thu nạp tàn quân 1/2». Nếu không có ai thu nhận, hải tặc bị đánh bại sẽ tập hợp tàu lại.

### Đồ đi mưa

![Mưa trên biển](guide/p33_rain)

| # | Mục | Chức năng |
| --- | --- | --- |
| 1 | Dòng trạng thái | Mưa rào hay mưa như trút, và biện pháp hiện tại |
| 2 | Đồ đi mưa | Chỉ hiện khi trời mưa — chọn một trong ba cách dưới đây |

| Biện pháp | Hiệu quả |
| --- | --- |
| Tiếp tục làm việc trên boong | Tốc độ không đổi (×0,92 khi mưa như trút). Hứng được chút nước mưa |
| Thay phiên nghỉ trong khoang | Mệt mỏi −1,2, kỷ luật +0,2, tốc độ ×0,85 |
| Căng vải buồm hứng nước mưa | Hứng được 1,2× lượng nước dùng mỗi ngày (2,5× khi mưa như trút). Mệt mỏi +0,4, tốc độ ×0,95 |

Mệt mỏi do ướt sũng khác nhau tùy vùng biển — trong vòng 25° vĩ độ, mưa rào thậm chí cho −0,6; quá 50°, mưa rào +1,0 · mưa như trút +2,0.

### Câu cá (F)

| Bước | Điều khiển |
| --- | --- |
| Quăng câu | Nhấn Space (hoặc nút) trên thanh lực lên xuống. Lực càng mạnh càng xuống nước sâu |
| Chờ | Giật cần khi phao chìm và hiện «!». Giật sớm quá thì cá sẽ thoát |
| Kéo lên | Giữ để quay dây, thả để nhả dây. Chỉ kéo được khi độ căng nằm trong vùng xanh (vùng rộng thêm theo mỗi bậc Thuật điều tàu) |

- Mỗi ngày 3 mồi. Không câu được khi có bão.
- Cá thành lương thực, cá hiếm thành phát hiện. Cũng có thể câu được thư trong chai (một manh mối), trai ngọc hoặc hổ phách.

## Thám hiểm đất liền

### Màn hình đất liền

![Thám hiểm đất liền](guide/p40_land)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Thám hiểm · Đội · Chi phí mỗi ngày | Chi phí = (5 + số người trong đội) × hệ số thú cưỡi (sa mạc ×1,5). Không trả đủ thì mệt mỏi +6, và thành viên có thể bỏ đi |
| 2 | Địa hình · Thú cưỡi | Thú cưỡi hợp với địa hình nơi đây đến đâu (◎○△×) |
| 3 | Đi / Dừng | Đi bộ hoặc đứng yên — một ngày đi bộ mất 1,3 giây thực |
| 4 | Quay lại | «Trở về điểm xuất phát» → khi đến nơi, «Lên tàu» hoặc «Về thành phố» |
| 5 | Vào thành | Khi có thành phố trong vòng 0,3° |
| 6 | Cắm trại | Menu cắm trại (trang sau) |
| 7 | Hải đồ | Bản đồ khu vực (rộng 60° kinh độ) |
| 8 | Đi theo chuột | Giống trên biển |

- Bấm vào mặt đất để đi đến đó. Phím mũi tên giữ hướng đi liên tục; bàn phím số 1–9 cho tám hướng.
- Dấu «?» mờ trên bản đồ là phát hiện mà đội trinh sát đã để ý. Đến càng gần thì vùng càng hẹp lại. Màu sắc: địa lý xanh trời · thiên nhiên xanh lá · di tích cam · bảo vật vàng · sinh vật đỏ · con người tím.
- Khi kết thúc thám hiểm, thú cưỡi được gửi ở chuồng cổng thành nếu bạn trở về thành, hoặc giao cho một làng ven biển với 30% giá nếu bạn trở về tàu.

### Cắm trại

![Menu cắm trại](guide/p41_camp)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Nghỉ ngơi (3 ngày) | Mệt mỏi −25 (nhiều hơn nếu có kỹ năng Thuật điều tàu, Nấu ăn và Âm nhạc) |
| 2 | Sửa tàu (2 ngày) | Ở nơi nhìn thấy tàu (trong vòng 1,2°), có tàu hư hại và vật liệu |
| 3 | Săn bắn (1 ngày) | Lương thực, ở nơi nhìn thấy tàu. Có thể phải đánh nhau với bầy thú |
| 4 | Lấy nước (1 ngày) | Nước, ở nơi nhìn thấy tàu. Lượng nước tùy vùng đất |
| 5 | Trinh sát (2 ngày) | Mở rộng bản đồ và khảo sát khu vực. Đôi khi tìm được đường tắt |
| 6 | Hái thảo dược (1 ngày) | Nếu thành công, ít sốt hơn trong 12 ngày và mệt mỏi −8 |

## Chiến đấu

### Hải chiến

![Hải chiến](guide/p50_battle)

| # | Nút | Chức năng |
| --- | --- | --- |
| 1 | Quân ta · Quân địch | Số tàu và thủy thủ |
| 2 | Gió · Chiến trường | Gió và nơi giao chiến |
| 3 | Lệnh hạm đội | Phím 1–7 (bảng dưới) |
| 4 | Kỳ hạm ta | Tàu số 1. Mất nó là thua trận |
| 5 | Kỳ hạm địch | Tàu số 1. Đánh chìm hoặc chiếm được là thắng |
| 6 | Tạm dừng | P. Đang tạm dừng vẫn ra lệnh được |
| 7 | ×1 ×2 ×3 | Tốc độ trận đánh (＋ −). Giữ nguyên cho trận sau |
| 8 | Áp mạn | B. Áp sát tàu địch và nhảy sang |
| 9 | Rút lui | Cả hạm đội lẩn ra mép chiến trường |

### Lệnh hạm đội (1–7)

| Phím | Khi có tàu cùng chiến đấu | Chỉ có kỳ hạm |
| --- | --- | --- |
| 1 | Theo kỳ hạm — đi sau kỳ hạm và bắn cùng một kẻ địch | Tự cầm lái |
| 2 | Hạc dực trận — bao vây nửa vòng tròn với kỳ hạm ở giữa | (tắt) |
| 3 | Tổng tấn công — áp sát một tàu địch | Xung phong |
| 4 | Đấu pháo — chỉ dùng pháo, từ rìa tầm bắn | Tập trung pháo kích |
| 5 | Hộ vệ kỳ hạm — bảo vệ khu vực quanh kỳ hạm | (tắt) |
| 6 | Tự do tấn công — mỗi tàu đánh kẻ địch gần nhất | Tự động giao chiến |
| 7 | Rút ra — riêng tàu đó rời chiến trường | Rút lui |

- Lái kỳ hạm bằng phím mũi tên; bấm vào biển để đi đến đó, bấm vào tàu địch để tấn công. Đại bác tự bắn vào kẻ địch ở bên mạn tàu.
- Bấm vào một tàu của ta hoặc chọn bằng Tab để ra lệnh riêng cho tàu đó.
- Chuột phải: đưa tàu đang chọn (hoặc kỳ hạm, nếu chưa chọn tàu nào) đến chỗ đó (đến rồi giữ vị trí). Chuột phải vào tàu địch để nhắm mục tiêu.
- Kẻ địch chia mục tiêu, vòng sang mũi và đuôi tàu ta để tránh hỏa lực mạn, và xoay sang mạn đã nạp đạn trong khi nạp mạn kia. Chúng ném móc vào những tàu đã tan nát, và hải tặc có thể bỏ chạy khi mất kỳ hạm.
- Hai tàu ta trở lên bao vây một tàu địch thì hỏa lực +20%, ba tàu trở lên +35%.
- Mất kỳ hạm ta thì phải vứt bỏ một nửa hàng hóa, và tàu kế tiếp trở thành kỳ hạm.

### Đấu tay đôi

![Đấu tay đôi — chọn thế](guide/p51_duel)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Sức khỏe · Khí thế | Tích lũy khí thế để dùng chiêu thức |
| 2 | Tương khắc | Đâm → Chém → Bổ → Đâm (mỗi đòn thắng đòn mà mũi tên chỉ tới) |
| 3 | Thế (phím 1–4) | Toàn lực xung phong · Đòn mạnh · Bắt sống · Phòng thân trước — hiệu quả ghi trên thẻ |
| 4 | Nước tiếp theo | 0 tự động · 1 Chém · 2 Đâm · 3 Bổ |
| 5 | Chiêu thức | Con số là khí thế cần tốn (loại chỉ dùng một lần thì dùng được một lần) |
| 6 | Tạm dừng · Nhanh hơn · Rút lui | Space · — · Esc. Với thế Phòng thân trước, rút lui luôn thành công (các thế khác 60%) |

### Đấu tay đôi — Các hiệp

![Đấu tay đôi — giữa trận](guide/p52_duel_fight)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Hiệp | Đang ở hiệp thứ mấy |
| 2 | Hiệp trước | Đòn hai bên đã ra, và tương khắc |
| 3 | Nước tiếp theo | Thắng tương khắc: +15 điểm phần trăm trúng đòn, sát thương ×1,35 · thua: sát thương ×0,75 |
| 4 | Chiêu thức | Đòn chí mạng (50) · Tiên phát chế nhân (15) · Đánh sườn (25) · Bắt giữ (20) · Giả vờ rút lui (15) · Bí khí (một lần) · Dụ địch (15) · Đổi người (một lần) · Thuyết phục (30) · Đòn nhử (15) · Hét xung trận (20) · Tuyệt chiêu (100) |

- Khí thế: +10 khi bị đánh trúng, +4 khi đánh trúng, +6 khi đỡ được.
- Một số trận cho phép chọn «Giao cho phó quan». Nếu phó quan thua trận đấu tay đôi trong hải chiến, người đó bị thương 30 ngày.

### Trận đánh trên bộ

![Trận đánh trên bộ — lập đơn vị](guide/p42_landwar)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Ô đơn vị | Bấm để đổi giữa bộ binh, súng hỏa mai, kỵ binh và pháo binh (đơn vị Đô đốc + tối đa 5 đơn vị) |
| 2 | Đơn vị Đô đốc | Nếu vỡ trận thì thua |
| 3 | Thủ lĩnh địch ★ | Hạ được là thắng |
| 4 | Bắt đầu trận đánh | Bắt đầu giao chiến |
| 5 | Tránh | Rút lui (nếu thất bại, địch đánh vào hậu quân) |

### Trận đánh trên bộ — Mệnh lệnh

| Phím | Mệnh lệnh | Hiệu quả |
| --- | --- | --- |
| 1 | Tấn công | Mọi người cùng đánh. Bấm vào đơn vị địch để nhắm |
| 2 | Phòng thủ | Sát thương nhận ×0,5; đơn vị cận chiến phản đòn |
| 3 | Phục kích | Thành công tùy địa hình (cao ở rừng, rừng rậm và núi). Gây sát thương toàn quân địch + cầm chân một lần |
| 4 | Bẫy | Đơn vị địch xung phong tiếp theo chịu sát thương nặng |
| 5 | Bắn tỉa | 50% quân của thủ lĩnh địch |
| 6 | Đạn nổ | Cần pháo binh và đạn nổ. Gây sát thương toàn quân địch |

- 3–6 mỗi cái dùng được một lần mỗi trận. «Tự động» lặp lại Tấn công.
- Đơn vị: bộ binh (một đơn vị địch) · súng hỏa mai (ba đơn vị phía trước) · kỵ binh (với tới hàng sau và thủ lĩnh; cần ngựa, lạc đà hoặc voi) · pháo binh (toàn quân địch; cần đại bác và thú thồ hoặc xe; chỉ một đơn vị).
- Quân ta còn dưới 20% quân số ban đầu cũng là thua. Trong số người ngã xuống, 25% + Y thuật × 15% sống sót trở về.

## Thủy thủ đoàn và khoang tàu

### Bố trí thuộc hạ

![Bố trí thuộc hạ](guide/p60_roles)

| # | Mục | Chức năng |
| --- | --- | --- |
| 1 | Khoang kỳ hạm | Xếp thuộc hạ vào từng phòng (trang sau) |
| 2 | Tự động bố trí | Xếp những thuộc hạ chưa có chức vụ ở quán rượu vào khoang kỳ hạm và các vị trí trên tàu khác cho hợp năng lực. Bên phải: số người đang chờ |
| 3 | Người trên các tàu khác | Thuyền trưởng, người lái, boong, đài quan sát và các khoang của mỗi tàu (tự động) |
| 4 | Tên thuộc hạ | Bấm để chọn chức vụ trên kỳ hạm — phó quan, hoa tiêu, trắc địa viên, thông dịch viên, kế toán viên · không chức vụ · cho thôi việc |
| 5 | Vị trí hiện tại | Nơi đang ở: Phòng phó quan, boong, «Thuyền trưởng · tàu ○○»… Nền xanh nghĩa là người ở tàu khác |
| 6 | «Đang chờ» màu đỏ | Thuộc hạ không có vị trí — trung thành −2 mỗi tháng |

### Chức vụ và kỹ năng

| Chức vụ | Kỹ năng được dùng |
| --- | --- |
| Phó quan | Kiếm thuật, Pháo thuật, Bắn súng, Y thuật, Đóng tàu, Khoa học, Kế toán, Hùng biện, Thần học, Lịch sử, Thủ công |
| Hoa tiêu | Thuật hàng hải, Thuật điều tàu, Nấu ăn, Âm nhạc |
| Trắc địa viên | Trắc địa, Lịch sử, Vẽ |
| Thông dịch viên | Các ngôn ngữ người đó biết |
| Kế toán viên | Kế toán |
| Thuyền trưởng (tàu khác) | Thuật hàng hải, Pháo thuật, Kiếm thuật, Đóng tàu — chỉ trên tàu của mình |
| Người lái, boong, đài quan sát, khoang (tàu khác) | Không dùng — chỉ giữ cho trung thành không giảm |

- Kỹ năng của chính Đô đốc luôn được tính, và cùng một kỹ năng thì lấy bậc cao nhất.
- Trung thành từ 40 trở xuống thì thuộc hạ chỉ làm việc ×0,75, từ 20 trở xuống ×0,5. Thuộc hạ không có vị trí (đang chờ) mất 2 trung thành mỗi tháng.

### Vị trí trên các tàu khác

- Mỗi tàu ngoài kỳ hạm có bốn vị trí — **thuyền trưởng · người lái · boong · đài quan sát** — cộng thêm số khoang tùy cỡ tàu.
- Mọi người **tự động** nhận vị trí hợp năng lực: thuyền trưởng cho người giỏi Thuật hàng hải, Pháo thuật, Kiếm thuật, Đóng tàu và Sức mạnh; người lái cho Thuật hàng hải và Thuật điều tàu; boong cho Thuật điều tàu và Kiếm thuật; đài quan sát cho Trắc địa và Lịch sử. Nếu thiếu người, mỗi tàu được chia đều.
- Thuyền trưởng chỉ huy tàu đó (bảng trên). Vị trí người lái, boong, đài quan sát và khoang không có hiệu quả cho hạm đội; chỉ giữ cho trung thành không giảm.
- Tự động bố trí diễn ra khi: vào thành phố · khi ra khơi · mỗi tháng · khi có thuộc hạ gia nhập · khi đổi kỳ hạm · sau hải chiến. Các phòng trống trên kỳ hạm cũng được lấp lúc đó, nhưng người đã ngồi trong khoang kỳ hạm thì giữ nguyên.
- Chức vụ trên kỳ hạm đặt ở quán rượu (phó quan, hoa tiêu, trắc địa viên, thông dịch viên, kế toán viên) không bị tự động bố trí thay đổi.

### Khoang kỳ hạm

![Khoang kỳ hạm](guide/p61_cabin)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Khoang · Thuộc hạ · Lương | 2–16 ô khoang tùy cỡ tàu. «Đang chờ n» là số thuộc hạ chưa có vị trí |
| 2 | Tự động bố trí | Xếp chỗ cho thuộc hạ chưa có chức vụ ở quán rượu, ưu tiên người có kỹ năng hợp với phòng (cả vị trí trên các tàu khác) |
| 3 | Biển tên | Vị trí cố định: phòng thuyền trưởng (Đô đốc) · Phòng phó quan (phó quan) · buồng lái (hoa tiêu) · đài quan sát (trắc địa viên) · boong |
| 4 | Số màu xanh | Sức mạnh của phòng = 1 + bậc kỹ năng hợp với phòng (thấp hơn nếu trung thành thấp) |
| 5 | Ghế trống | Bấm để xếp người. Cũng có thể kéo thả thuộc hạ vào |
| 6 | Thẻ khoang | Quyết định công dụng khoang trống bằng «Cải tạo khoang» ở xưởng đóng tàu |
| 7 | Danh sách thuộc hạ | Bấm để xếp chỗ. Thuộc hạ đang chờ ở trên cùng nền đỏ, người ở tàu khác nền xanh |
| 8 | Năng lực áp dụng cho hạm đội | Bậc kỹ năng (●●●) và hiệu quả khoang đang dùng theo cách xếp hiện tại. ▲▼ khi thay đổi |
| 9 | Các tàu khác | Thuyền trưởng, người lái, boong, đài quan sát và số khoang của mỗi tàu (cuộn xuống) |

### Loại khoang và hiệu quả

| Vị trí cố định | Hiệu quả (mỗi điểm sức mạnh) |
| --- | --- |
| Đài quan sát | Tầm nhìn thấy phát hiện +0,12° · tốc độ vẽ bản đồ +6% |
| Buồng lái | Mệt mỏi mỗi ngày −0,03 |
| Boong | Kỷ luật +0,04 (Thuật điều tàu, Kiếm thuật) |
| Phòng phó quan | Mỗi tháng trả lương, thuộc hạ dưới 70 trung thành được +1 |

| Khoang | Kỹ năng | Hiệu quả (mỗi điểm sức mạnh) |
| --- | --- | --- |
| Phòng bản đồ | Trắc địa, Vẽ | Bề rộng hải đồ +0,15° · tốc độ vẽ bản đồ +10% |
| Nhà bếp | Nấu ăn | Mệt mỏi mỗi ngày −0,05 |
| Phòng ăn | Nấu ăn, Hùng biện | Mệt mỏi −0,04, kỷ luật +0,03 |
| Phòng kế toán | Kế toán | Mặc cả +3 điểm phần trăm, lương −2% (tối đa −50%) |
| Nhà nguyện | Thần học | Kỷ luật +0,06 |
| Phòng y tế | Y thuật, Khoa học | Lây lan scorbut −7% (tối đa 60%) |
| Phòng giải trí | Âm nhạc | Kỷ luật +0,05 |
| Xưởng buồm | Thuật hàng hải, Thuật điều tàu | Tốc độ +1% (tối đa 8%) |
| Xưởng sửa tàu | Đóng tàu | Sửa chữa mỗi ngày +0,1 |
| Chuồng gia súc | Khoa học | Lương thực mỗi ngày +0,12 |
| Phòng pháo | Pháo thuật | Hỏa lực |
| Phòng lính thủy | Kiếm thuật, Bắn súng | Áp mạn +4% |
| Xưởng vẽ · Phòng điêu khắc | Vẽ · Thủ công | Làm tranh · tượng |
| Phòng nhạc | Âm nhạc | Mệt mỏi −0,07 |
| Phòng tham mưu | Thuật điều tàu, Lịch sử, Trắc địa | Kế sách trận bộ thành công +3 điểm phần trăm, sát thương +6% |
| Phòng thông dịch | — | Ngôn ngữ của người trong phòng này được dùng để thông dịch |

**Phòng liền kề** — Các thẻ khoang xếp thành hàng 6. Các phòng chạm nhau trên, dưới, trái, phải sẽ cộng sức mạnh (chéo thì không).

- **Hòa tấu ở phòng nhạc**: từ 2 người có kỹ năng Âm nhạc ở các phòng nhạc liền kề trở lên thì cùng chơi nhạc — 2 người song tấu · 3 người tam tấu · 4 người tứ tấu · 5–6 người ban nhạc · 7 người trở lên dàn nhạc. Bậc Âm nhạc và Hùng biện của các thành viên càng cao và càng đông người, thì mệt mỏi mỗi ngày trên biển càng giảm và kỷ luật càng tăng, và khi bán hàng thời thượng ở thành cập bến thì mức tăng nhờ thời thượng càng lớn (tối đa +75%). Thẻ hiện tên nhóm hòa tấu.
- **Bữa ăn nóng hổi**: khi nhà bếp và phòng ăn chạm nhau, món vừa nấu được dọn ra trước khi nguội — hiệu quả mệt mỏi, kỷ luật và mỹ vị của hai phòng ×1,25, và hệ số thực đơn nhà bếp +0,25.

Nhiều phòng cùng loại thì cộng sức mạnh lại, tối đa 8.

## Chỉ số · Kỹ năng · Ngôn ngữ

Sở trường của Đô đốc nằm ở ba thứ — **chỉ số** (tố chất bẩm sinh), **kỹ năng** (năng lực học và rèn luyện) và **ngôn ngữ** (khả năng hiểu và nói). Chương này mô tả «mỗi thứ dùng vào việc gì» hơn là các con số.

### Chỉ số — Bốn loại

Có bốn chỉ số — **Sinh lực · Trí tuệ · Sức mạnh · Sức hút** — hiện bằng các thanh ở thẻ «Đô đốc» trong Sổ tay. (Trên thẻ hoa tiêu ở quán rượu, và khi dạy con ở nhà, Sinh lực còn được gọi là «Thể lực».)

- **Định sẵn từ đầu** — Càng trẻ thì Sinh lực và Sức mạnh càng cao; càng lớn tuổi thì Trí tuệ và Sức hút càng cao. Nghề nghiệp cộng thêm chút ít vào các chỉ số hợp với nghề, và cung hoàng đạo theo ngày sinh tăng một chỉ số. Càng lớn tuổi càng được nhiều điểm thưởng để chia vào chỉ số mong muốn.
- **Thay đổi suốt cuộc đời** — Chỉ số tăng dần nhờ **kinh nghiệm** thu được khi làm nên việc (xem «Kinh nghiệm và trưởng thành»), và đôi khi nhờ **sự kiện lớn** như tước vị, hôn nhân và đi vòng quanh thế giới.
- **Tuổi tác** — Khi còn trẻ, Sinh lực tăng dần, nhưng qua tuổi trung niên thì Sinh lực và Sức mạnh giảm mỗi năm. Phiêu lưu lúc tuổi già dựa vào Trí tuệ và Sức hút.
- **Chỉ số của thuộc hạ** — Thuộc hạ cũng có bốn chỉ số. Khi họ đấu tay đôi thay bạn, khi thuyền trưởng tàu khác đánh áp mạn, và khi họ giúp sức lúc báo cáo và công bố, chỉ số của thuộc hạ đó được dùng — và cách nói năng, tính cách của họ cũng phản ánh chỉ số.
- **Chiêu mộ bạn đồng hành** — Mỗi hoa tiêu có điều mình thích, và nếu chỉ số mà họ coi trọng của bạn cao, họ sẽ dễ được thu phục hơn.

### Sinh lực · Trí tuệ

**Sinh lực** — sức chịu đựng

- Sức bền khi đấu tay đôi tăng lên. Với thuộc hạ, còn có thể bị thương nhẹ hơn khi trúng đòn.
- Uống ly này đến ly khác ở quán rượu mà không say gục.
- Tiền công làm việc vặt ở nhà trọ tăng lên.
- Kinh nghiệm: tăng nhờ ẩm thực, chiến đấu và đấu tay đôi. Qua tuổi trung niên thì giảm chút ít mỗi năm.

**Trí tuệ** — sức học hỏi

- Trí tuệ quyết định học được **bao nhiêu** kỹ năng và ngôn ngữ (giới hạn khi tạo Đô đốc và khi rèn luyện ở phường hội).
- Trí tuệ cao lúc tạo nhân vật thì được thêm điểm kỹ năng. Trí tuệ cao nhất còn được thêm một điểm nữa.
- Rèn kỹ năng và học ngôn ngữ ở phường hội thuận lợi hơn. Làm việc vặt ở nhà trọ cũng nhanh nhạy tiếng địa phương hơn.
- Khi đấu tay đôi, các mẹo như Giả vờ rút lui, Dụ địch và Đòn nhử hiệu quả hơn, và ít mắc mẹo của đối thủ hơn.
- Trí tuệ rất cao thì sau trận đánh trên bộ cứu được thêm vài người ngã xuống.
- Chơi cờ với con ở nhà thì Trí tuệ của bạn tăng lên khi đấu với Trí tuệ của con.
- Kinh nghiệm: tăng nhờ buôn bán, thuyết phục, giao tế, và đọc sách lần đầu.

### Sức mạnh · Sức hút

**Sức mạnh** — sức chiến đấu

- Đấu tay đôi đánh mạnh hơn — trúng đòn nhiều hơn, đau hơn, và ra đòn trước.
- Các chiêu quyết định khi đấu tay đôi hiệu quả hơn: Đòn chí mạng (Sức mạnh rất cao thì có thể ra đòn dù đối thủ chưa bị thương nặng) · Bắt giữ · Hét xung trận.
- **Sức mạnh của thuộc hạ làm thuyền trưởng tàu khác** trở thành sức tấn công áp mạn của tàu đó. (Kỳ hạm có Đô đốc thì đánh bằng vũ khí của Đô đốc.)
- «Gây sức ép» khi đòi nợ hiệu quả hơn, và «Nhắc đến kẻ thù chung» có sức nặng hơn trong đàm phán ngoại giao.
- Kinh nghiệm: tăng nhờ chiến đấu và đấu tay đôi. Qua tuổi trung niên thì giảm chút ít mỗi năm.

**Sức hút** — sức chinh phục lòng người

- Đàm phán hợp đồng với nhà bảo trợ, dùng tài hùng biện thuyết phục họ về những phát hiện ngoài sở thích, và đàm phán hiệp ước với triều đình nước ngoài đều thuận lợi hơn.
- Mặc cả ở thương điếm và chợ hiệu quả hơn.
- «Ôn tồn giải thích» khi đòi nợ, và dùng lời lẽ xoa dịu kẻ cầm đầu khi có binh biến hiệu quả hơn.
- Khi Đô đốc giúp sức lúc báo cáo và công bố, mọi việc suôn sẻ hơn. Sức hút rất cao thì còn thuyết phục nhà bảo trợ khác giới tốt hơn nữa.
- Khi đấu tay đôi, dễ khiến đối thủ tra kiếm vào vỏ bằng «Thuyết phục» hơn, và «Hét xung trận» cũng có sức nặng hơn.
- Kinh nghiệm: tăng nhờ thuyết phục, giao tế và buôn bán, và tăng khi nhận tước vị hoặc kết hôn.

### Kinh nghiệm và trưởng thành

Mỗi lần làm nên việc gì, **kinh nghiệm** của loại đó được tích lũy và chia cho các chỉ số đã định cho loại đó.

| Kinh nghiệm | Khi nào tích lũy | Chỉ số tăng |
| --- | --- | --- |
| Thuyết phục | Thuyết phục, đàm phán và trấn an nhà bảo trợ · đàm phán với chỉ huy đồn trú · dẹp binh biến · đòi nợ (bằng lời) · đàm phán hiệp ước ở triều đình · «Thuyết phục» khi đấu tay đôi · giúp sức lúc báo cáo | Sức hút · Trí tuệ |
| Buôn bán | Mua bán ở thương điếm (lời càng lớn càng nhiều) · mặc cả thành công | Trí tuệ · Sức hút |
| Chiến đấu | Hải chiến · trận đánh trên bộ (thắng thì nhiều hơn, địch càng mạnh càng nhiều) | Sức mạnh · Sinh lực · Trí tuệ |
| Đấu tay đôi | Những trận Đô đốc tự mình giao kiếm (thuộc hạ đấu thay thì không có) | Sức mạnh · Sinh lực |
| Ẩm thực | Một bữa ở nhà hàng (gấp đôi với món lần đầu nếm) | Sinh lực · Sức hút · Trí tuệ |
| Giao tế | Mỗi lần được danh tiếng giao tế | Sức hút · Trí tuệ |

- Thất bại cũng học được chút ít (thuyết phục thất bại hay thua trận vẫn tích lũy kinh nghiệm).
- **Chỉ số càng cao, tăng thêm 1 càng khó hơn nhiều.** Đến mức trung bình thì nhanh, nhưng cao hơn nữa thì mất nhiều năm, thậm chí vài chục năm.
- Mỗi chỉ số có giới hạn kinh nghiệm nhận được mỗi ngày và mỗi năm, nên không thể lặp đi lặp lại một việc để đẩy lên. Cả một đời chỉ nhờ kinh nghiệm cũng hầu như không bao giờ chạm 100.
- Chỉ số còn tăng nhờ **sự kiện lớn**: được ban tước vị · cuộc hôn nhân đầu tiên · được phong hiệp sĩ Anh (Sức hút), giải cứu vương nữ mất tích · đại thắng hải chiến (Sức mạnh), cuộc đào thoát của công chúa Elizabeth (Trí tuệ), viết hồi ký người đắm tàu · đi vòng quanh thế giới (Sinh lực và Trí tuệ). Với chỉ số đã rất cao, sự kiện không tăng trực tiếp mà cộng thêm kinh nghiệm.
- Khi chỉ số tăng sẽ có thông báo và một dòng trong nhật ký. Ở mục «Kinh nghiệm và trưởng thành» trong thẻ «Đô đốc» của Sổ tay có thể xem kinh nghiệm từng loại và còn bao nhiêu nữa đến điểm tiếp theo.

### Kỹ năng — Bậc và cách sử dụng

Có 17 kỹ năng, mỗi kỹ năng có **bậc 0–3** (◇◇◇ → ◆◆◆).

- **Bậc của ai được dùng** — Trong số Đô đốc, các thuộc hạ giữ chức vụ dùng kỹ năng đó (phó quan, hoa tiêu, trắc địa viên, kế toán viên) và thuộc hạ ở các khoang dùng kỹ năng đó, **bậc cao nhất** được áp dụng cho cả hạm đội.
- **Kỹ năng chỉ cần có người trên tàu là có tác dụng** — Nấu ăn, Âm nhạc, Vẽ và Thủ công phần lớn có tác dụng miễn là có ai trong hạm đội biết, kể cả không có chức vụ. Y thuật chống scorbut cũng có tác dụng từ bất kỳ ai trên tàu.
- **Kỹ năng dùng theo từng tàu** — Hỏa lực, áp mạn, thiệt hại do bão và sửa chữa trên các tàu khác chỉ dựa vào kỹ năng của thuyền trưởng tàu đó.
- **Khi trung thành thấp**, thuộc hạ không phát huy hết kỹ năng. Khi bị thương thì chỉ được một nửa.

**Cách học kỹ năng**

- **Tạo Đô đốc** — Dùng điểm để nâng các kỹ năng ban đầu do nghề nghiệp định ra. Trí tuệ quyết định học được bao nhiêu.
- **«Rèn kỹ năng» ở phường hội** — Tốn tiền và ngày để lên từng bậc một. Trí tuệ cao thì có lợi, bậc càng cao càng khó. Thất bại thì chỉ mất tiền và ngày.
- **Thuộc hạ** — Ở lâu trong một khoang, thuộc hạ sẽ thạo nghề của phòng đó, và bậc tăng dần theo năm tháng (Hùng biện ở Phòng phó quan, Thuật hàng hải ở buồng lái, Trắc địa ở đài quan sát). Kỹ năng chính của phòng (★) cho +1, +2, +3 sau 3, 9 và 27 năm; kỹ năng phụ (☆) chậm hơn 1,2 lần, cho +1, +2, +3 sau 3,6, 10,8 và 32,4 năm (ví dụ phòng lính thủy — ★Kiếm thuật · ☆Bắn súng). Kỹ năng tối đa đến 3.
- **Con cái** — Lớn lên khi được dạy ở nhà và theo các chuyến học việc trên biển (đến bậc kỹ năng trong hạm đội của Đô đốc). Trước tuổi trưởng thành (16) chỉ đạt tối đa bậc 2; bậc càng cao càng khó và Trí tuệ càng cao học càng giỏi. Chúng còn học kỹ năng của người mẹ sống cùng. Khi lớn và lên tàu thì học trong khoang như mọi thuộc hạ.
- Đọc sách không làm tăng kỹ năng. Thay vào đó, sách học thuật chỉ đọc được khi có người hiểu lĩnh vực đó.

**Tổ hợp kỹ năng LV3 — năng lực ẩn**

Khi chính Đô đốc thông thạo cả ba kỹ năng tương ứng đến LV3, một năng lực ẩn sẽ hiện ra trong hồ sơ. Bậc thực tế của thuộc hạ không mở được. Dù có nhiều tổ hợp, mỗi lĩnh vực đều có giới hạn, nên không mạnh vượt trội so với kỹ năng, khoang tàu và trang bị thông thường.

| Năng lực ẩn | Kỹ năng cần có | Hiệu quả |
| --- | --- | --- |
| Đô đốc bất bại | Kiếm thuật · Bắn súng · Pháo thuật | Sát thương trận bộ +10% |
| Chuyên gia sinh tồn | Thuật hàng hải · Thuật điều tàu · Y thuật | Chi phí trên bộ −15%, mức tăng mệt mỏi −10% |
| Trùm mafia | Hùng biện · Kế toán · Kiếm thuật | Mặc cả và đòi nợ +6 điểm phần trăm |
| Thánh sống | Thần học · Y thuật · Âm nhạc | Bệnh tật trên bộ −15%, sụt kỷ luật −10% |
| Đại hoa tiêu | Thuật hàng hải · Thuật điều tàu · Trắc địa | Tốc độ hải hành +5% |
| Đề đốc thiết giáp | Pháo thuật · Đóng tàu · Thuật điều tàu | Sát thương đại bác +6%, sửa chữa +10% |
| Chỉ huy lính thủy | Kiếm thuật · Bắn súng · Thuật điều tàu | Sát thương trận bộ +5%, tổn thất quân ta −8% |
| Kẻ săn bão | Thuật hàng hải · Đóng tàu · Khoa học | Thiệt hại do bão −15%, tốc độ +2% |
| Hoàng tử thương nhân | Kế toán · Hùng biện · Trắc địa | Giá mua −2%, giá bán +2% |
| Tiến sĩ báu vật | Lịch sử · Thủ công · Trắc địa | Giá trị và danh tiếng phát hiện +6% |
| Người Phục hưng | Lịch sử · Khoa học · Vẽ | Giá trị và danh tiếng phát hiện +5% |
| Danh y | Y thuật · Khoa học · Nấu ăn | Bệnh tật trên bộ −20%, mức tăng mệt mỏi −5% |
| Thần tượng của thủy thủ | Âm nhạc · Hùng biện · Thần học | Sụt kỷ luật −15% |
| Nhà ngoại giao hoàng gia | Hùng biện · Lịch sử · Thần học | Mặc cả và đòi nợ +4 điểm phần trăm, giá bán +1% |
| Nhà bác học | Lịch sử · Khoa học · Thần học | Giá trị và danh tiếng phát hiện +4%, bệnh tật trên bộ −5% |
| Đại tôn sư | Thủ công · Vẽ · Lịch sử | Giá trị và danh tiếng phát hiện +4%, giá bán +1% |
| Sói biển | Thuật hàng hải · Kiếm thuật · Pháo thuật | Tốc độ +2%, áp mạn khi hải chiến +8% |
| Thần xạ thủ | Bắn súng · Pháo thuật · Trắc địa | Độ chính xác đại bác +5%, sát thương +4% |
| Bậc thầy hậu cần | Kế toán · Thuật điều tàu · Nấu ăn | Lượng lương thực và nước dùng −8%, chi phí trên bộ −8% |
| Vua đóng tàu | Đóng tàu · Thủ công · Khoa học | Sửa chữa +15%, thiệt hại do bão −5% |

Giới hạn cuối cùng khi cộng dồn là tốc độ hải hành +8%, sát thương đại bác +10%, áp mạn khi hải chiến +8%, giá trị và danh tiếng phát hiện +15%, sửa chữa trên biển +20%, và mức giảm thiệt hại do bão, chi phí trên bộ và sụt kỷ luật mỗi loại tối đa 20–25%.

### Kỹ năng — Tàu và biển (1)

**Thuật hàng hải** (hoa tiêu · xưởng buồm; trên tàu khác là thuyền trưởng tàu đó)

- Giảm mệt mỏi tích tụ mỗi ngày trên biển.
- Giảm thiệt hại cho tàu, thủy thủ và lương thực khi gặp bão (không giúp tránh bão). Thuật hàng hải của kỳ hạm cũng giúp được các tàu khác một chút.
- Tàu có thuyền trưởng giỏi Thuật hàng hải đi nhanh hơn và ít mất tốc độ khi chạy chữ chi ngược gió.
- Bỏ chạy khỏi kẻ địch, tránh núi băng và bãi cạn, và nhận ra điềm báo sóng thần thuận lợi hơn.
- Nếu không ai biết Thuật hàng hải, phó quan sẽ cố ngăn bạn khi ra khơi. Cần để đọc một số sách về hàng hải.

**Thuật điều tàu** (hoa tiêu · boong · xưởng buồm · phòng tham mưu)

- Kỷ luật thủy thủ ít sụt hơn trên biển. Khi nhiều tàu đi cùng nhau, giúp kéo các tàu chậm để đội hình ít bị tụt lại.
- Khi thám hiểm đất liền, đi nhanh hơn, ít mệt hơn, và nghỉ ở trại hiệu quả hơn. Tổn hại do nắng nóng sa mạc và bão cát giảm, và dễ bảo vệ đoàn trong bão tuyết và đầm lầy hơn.
- Giảm thiệt hại do thiên tai, thu được nhiều hơn khi gặp đàn cá, và cá cắn câu dễ hơn.
- Ở phòng tham mưu, kế sách trận bộ (phục kích, bẫy, bắn tỉa) hiệu quả hơn.

### Kỹ năng — Tàu và biển (2)

**Trắc địa** (trắc địa viên · phòng bản đồ · đài quan sát · phòng tham mưu)

- **Từ bậc 2 có thể thấy vĩ độ trên biển** (kinh độ cần kính lục phân).
- Mở rộng phạm vi tìm cảng chưa biết, vùng hải đồ hiện ra, và khoảng cách mà người quan sát nhận ra sự vật trước tiên. Cả trinh sát trên bộ.
- Tìm phát hiện trên biển không cần manh mối, theo chim biển đến cảng mới, và tìm đường núi cũ thuận lợi hơn. Lấy nước ở trại cũng được nhiều hơn.
- Giúp phục kích và đặt bẫy trong trận bộ, và nhận ra điềm báo thiên tai. Trắc địa càng cao, bản đồ kho báu càng thu hẹp vị trí với nhiều bằng chứng hơn.
- Nếu kế hoạch thám hiểm không có ai biết Trắc địa, sẽ có cảnh báo. Cần để đọc một số sách học thuật.

**Đóng tàu** (phó quan · xưởng sửa tàu; trên tàu khác là thuyền trưởng tàu đó)

- Sửa tàu trên biển bằng vật liệu (không có vật liệu thì không sửa được). Xưởng sửa tàu sửa kỳ hạm được nhiều hơn.
- Sửa chữa được nhiều hơn hẳn khi cắm trại trên bờ để sửa tàu, và trong sự kiện đắm tàu.
- Nếu biết tiếng địa phương, sổ tay có thể cho biết thành chưa ghé có xưởng đóng tàu hay không, và trình độ đến đâu.

### Kỹ năng — Chiến đấu

**Kiếm thuật** (phó quan · boong · phòng lính thủy; trên tàu khác là thuyền trưởng tàu đó)

- Áp mạn trong hải chiến mạnh hơn. Phòng lính thủy trên kỳ hạm làm mạnh hơn nữa.
- Đấu tay đôi: Đô đốc chiến đấu bằng **Kiếm thuật của chính Đô đốc** (không cộng Kiếm thuật của thuộc hạ). Đánh trúng thường hơn, nhiều đòn chí mạng và đòn tiên phát hơn, và đọc được nước đi của đối thủ tốt hơn. Nếu thuộc hạ đấu thay, họ dùng Kiếm thuật của chính mình, và khi «Đổi người» thì người mạnh nhất bước ra.
- Trận bộ: bộ binh, kỵ binh và đơn vị Đô đốc mạnh hơn, và ở bậc 3 kỵ binh thành kỵ binh nặng. Kiếm thuật, Bắn súng và Pháo thuật đều bậc 3 thì đơn vị Đô đốc thành đơn vị Đô đốc bất bại.
- Săn bắn được thêm chút ít, và dễ đứng vững trước tàu ma hơn. Cũng dùng cho «Gây sức ép» khi đòi nợ.

**Pháo thuật** (phó quan · phòng pháo; trên tàu khác là thuyền trưởng tàu đó)

- Trong hải chiến nạp đạn nhanh hơn và bắn trúng nhiều hơn. Phòng pháo của kỳ hạm tăng thêm uy lực.
- Pháo binh trận bộ mạnh hơn, và ở bậc 3 thành pháo binh đại bác.

**Bắn súng** (phó quan · phòng lính thủy)

- Không dùng trong hải chiến — dành cho chiến đấu trên bộ và săn bắn.
- Đơn vị súng hỏa mai trận bộ mạnh hơn, và ở bậc 3 thành bộ binh súng trường. Kế sách «Bắn tỉa» hiệu quả hơn.
- Với «Bí khí» khi đấu tay đôi, bắn súng ngắn thay vì dao găm.
- Được nhiều lương thực hơn khi săn bắn và trong sự kiện đàn trâu.

### Kỹ năng — Chăm lo thủy thủ

**Y thuật** (phó quan · phòng y tế / với scorbut thì bất kỳ ai trên tàu)

- Scorbut khởi phát muộn hơn và lây chậm hơn. Phòng y tế làm chậm thêm nữa. Cũng phòng sốt trên biển tốt.
- Khi thám hiểm đất liền, ít mất người vì sốt hơn, dễ tìm thảo dược hơn, và chịu bão tuyết tốt hơn.
- Giảm thiệt hại do thiên tai, và giúp một số người ngã xuống đứng dậy sau trận bộ. Cũng cần cho một số sách học thuật và sự kiện truyện cổ.

**Nấu ăn** (bất kỳ ai)

- Bữa ăn trên tàu và ở trại làm giảm mệt mỏi. Cũng giảm mệt mỏi vào ngày mưa, và bữa tối vào ngày săn bắn thịnh soạn hơn.
- Khi có binh biến có thể chọn «Mở tiệc để xoa dịu» (chỉ cần Nấu ăn hoặc Âm nhạc). Sự kiện yến tiệc trên biển cũng xảy ra.
- Nhận ra giá trị của các phát hiện ăn được như hương liệu và cây trồng, và làm tăng giá trị đó.
- Đầu bếp ở nhà bếp nấu món quê nhà mình theo tay nghề, làm giảm mệt mỏi và tăng kỷ luật. Món quê nhà của Đô đốc còn được hoan nghênh hơn.

**Âm nhạc** (bất kỳ ai)

- Giữ kỷ luật thủy thủ bằng bài hát và nhạc cụ. Sự kiện hát ca thủy thủ đến thường hơn, và nghỉ ở trại hiệu quả hơn.
- Có thể mở tiệc khi có binh biến (giống Nấu ăn).
- Tăng giá trị các phát hiện dân gian như bài hát, điệu múa và nghi lễ của con người, và mở lòng người ngay tại chỗ.
- Phòng giải trí lo kỷ luật, phòng nhạc lo mệt mỏi. Các phòng nhạc chạm nhau sẽ thành nhóm hòa tấu (song tấu, tam tấu, tứ tấu, ban nhạc, dàn nhạc).

**Thần học** (phó quan · nhà nguyện)

- Giữ kỷ luật thủy thủ trên biển. Nhà nguyện giữ còn tốt hơn.
- Quyên góp cho nhà thờ được nhiều danh tiếng hơn, và cầu nguyện ở nhà thờ làm tăng kỷ luật.
- Không dao động khi gặp tàu ma hay tiên cá.
- Cần để đọc sách thần học.

### Kỹ năng — Con người và buôn bán

**Hùng biện** (phó quan · phòng ăn · Phòng phó quan)

- **Cần Hùng biện** để thử thuyết phục nhà bảo trợ về phát hiện ngoài sở thích của họ.
- Đàm phán hợp đồng với nhà bảo trợ thuận lợi hơn, và ít thiệt hơn khi xin tăng tiền ứng trước hay gia hạn — bậc càng cao, điều kiện giành được càng tốt.
- Dỗ dành quản gia khi danh tiếng chưa đủ, và «Gọi người làm chứng» khi bằng chứng yếu, hiệu quả hơn. Lúc báo cáo và công bố, mở lời với giọng tự tin.
- Khi vào cảng, đàm phán với chỉ huy đồn trú rẻ hơn và suôn sẻ hơn, và lẻn vào cũng dễ hơn.
- Nói chuyện với người bản địa để lấy manh mối, và chinh phục họ bằng quà, hiệu quả hơn.
- Dùng để xoa dịu kẻ cầm đầu binh biến, «Thuyết phục» khi đấu tay đôi, giữ chân thuộc hạ và vợ muốn ra đi, hòa giải cãi vã vợ chồng của thuộc hạ, «Ôn tồn giải thích» khi đòi nợ, và nghe chuyện bản đồ kho báu ở quán rượu.
- Nếu nói được tiếng địa phương và Hùng biện cao, bạn còn biết người đứng đầu những thành chưa ghé.

**Kế toán** (phó quan · kế toán viên · phòng kế toán)

- Mặc cả ở thương điếm hiệu quả hơn, giảm giá nhiều hơn, và mặc cả được nhiều lần hơn mỗi lần ghé. Có kế toán viên thì thêm một lần.
- **Cần Kế toán** để «Mặc cả» xuất hiện ở chợ.
- Chất hàng đều tay làm tăng trọng lượng tàu chịu được.
- **Ở bậc 3** có thể vào chợ đen hẻm sau ở các cảng lớn (mỗi vụ mua bán tăng tiếng xấu).
- Nếu biết tiếng địa phương, có thể biết đặc sản và mức thịnh vượng của những thành chưa ghé.
- Có **kế toán viên** thì mặc cả có lợi hơn nhiều, thêm một vòng đàm phán hợp đồng với nhà bảo trợ, và được tiền ứng trước lớn hơn. Phòng kế toán cắt giảm lương.

### Kỹ năng — Học vấn và phát hiện (1)

**Lịch sử** (phó quan · trắc địa viên · phòng tham mưu)

- Mở rộng phạm vi tìm phát hiện trên bộ, và dễ tìm thấy hơn khi không có manh mối. Trinh sát trên bộ cũng nhìn xa hơn.
- Nhận ra điềm báo thiên tai tốt. Từ bậc 2, nhận ra tốt hơn những thiên tai được ghi trong sử sách xưa.
- Biết người đứng đầu những thành chưa ghé.
- Cần để đọc sách lịch sử (một số bản thảo cổ cần bậc 2 mới giải đọc được).

**Khoa học** (phó quan · phòng y tế · chuồng gia súc)

- Làm chậm scorbut, phòng sốt trên biển, và giúp tìm thảo dược.
- Mở rộng phạm vi tìm phát hiện về sinh vật và thiên nhiên. Cũng nhận ra điềm báo thiên tai tốt.
- Cá hiếm cắn câu thường hơn. Trong câu đố của Nhân sư, loại bỏ một đáp án sai.
- Ở chuồng gia súc làm tăng lương thực. Cần để đọc sách khoa học.

### Kỹ năng — Học vấn và phát hiện (2)

**Vẽ** (bất kỳ ai · phòng bản đồ · xưởng vẽ)

- Tăng giá trị mọi phát hiện — danh tiếng, tiền thưởng báo cáo, tiền đặt tên.
- Quyết định **cấp bằng chứng**: vẽ càng giỏi càng thành «bản vẽ chi tiết»; vụng thì là «phác thảo»; không ai biết vẽ thì là «lời kể», mà nhà bảo trợ có thể nghi ngờ. Nếu sau này có thuộc hạ vẽ giỏi gia nhập, họ sẽ vẽ lại và nâng cấp bằng chứng.
- Ghi lại những cảnh tượng như đàn cá voi và thác nước vào sổ phác thảo để được danh tiếng. Đồ giả bạn trao đi cũng ít bị phát hiện hơn.
- Thuộc hạ ở xưởng vẽ sẽ vẽ tác phẩm nghệ thuật và chất vào khoang.
**Thủ công** (bất kỳ ai · phòng điêu khắc)

- Tăng mạnh giá trị phát hiện về bảo vật, di tích và dân gian, các loại khác tăng chút ít. Cũng nâng giá khi bán thánh tích.
- Thu được nhiều giá trị hơn từ bảo vật và di tích không có thánh tích. Cũng giúp nâng cấp bằng chứng.
- Đồ giả ít bị phát hiện hơn. Trang sức tặng cô hầu bàn và thuộc hạ lay động lòng người hơn.
- Thuộc hạ ở phòng điêu khắc sẽ làm tượng. Một số sự kiện truyện cổ chỉ mở ra khi có Thủ công.

### Ngôn ngữ — Hiểu được

Có 16 ngôn ngữ (tiếng Tây Ban Nha · tiếng Bồ Đào Nha · tiếng Rôman · tiếng German · tiếng Slav · tiếng Hy Lạp · tiếng Ả Rập · tiếng Ba Tư · tiếng Trung · tiếng Hindi · tiếng Duy Ngô Nhĩ · các tiếng châu Phi · các tiếng Trung Mỹ và Andes · các tiếng Đông Nam Á · các tiếng Đông Á · tiếng Hàn · các tiếng Bắc Mỹ), và các bậc là **Không biết · Cơ bản · Bình thường · Thông thạo**.

- **Ngôn ngữ của thành phố** — Mỗi thành có ngôn ngữ riêng, và mục «Ngôn ngữ» trên thanh trên cùng của màn hình thành phố cho biết bằng chấm đoàn của bạn nói tiếng đó tốt đến đâu. Ở những cảng do Bồ Đào Nha cai trị hoặc thương nhân Bồ Đào Nha hay lui tới, tiếng Bồ Đào Nha cũng dùng được.
- **Cửa sổ hội thoại** — Nếu Đô đốc không giỏi ngôn ngữ đó, những từ không nghe ra sẽ hiện bằng chữ lạ của nước đó. Bậc càng tăng thì nghe ra càng nhiều từ, và khi thông thạo thì hiểu hết.
- **Thông dịch** — Nếu thuộc hạ giữ chức phó quan, thông dịch viên hoặc ngồi ở phòng thông dịch nói tiếng đó giỏi hơn Đô đốc, một cửa sổ thông dịch hiện dưới hội thoại và dịch lại. Nếu người thông dịch cũng không giỏi, họ chỉ dịch được một phần, «hiểu đại khái» hoặc «nghe được loáng thoáng».
- **Người bản địa** — Dù hoàn toàn không có ngôn ngữ chung, ra hiệu tay chân cũng truyền đạt được chút ít.
- **Ngôn ngữ của ai được dùng** — Người giỏi nhất trong số Đô đốc, phó quan, thông dịch viên và những người ngồi ở phòng thông dịch. Thuộc hạ giữ chức vụ khác và thuyền trưởng các tàu khác không được tính. (Chỉ ở thư viện thì mọi thuộc hạ đi cùng mới cùng đọc.) Nhưng nếu có **Thông dịch trưởng** (bên dưới), ngôn ngữ của mọi thuộc hạ trên kỳ hạm đều được dùng.

### Ngôn ngữ — Điều bị chặn và điều được cải thiện

**Không làm được nếu hoàn toàn không biết tiếng**

- Mặc cả ở thương điếm và chợ (mua bán thì vẫn được)
- Nghe chuyện buôn bán, tin tức về hợp đồng, điểm đến và chuyện bàn nhậu ở quán rượu
- Đòi nợ, và đàm phán với chỉ huy đồn trú ở cổng thành
- Yết kiến nhà bảo trợ (quản gia sẽ không tiếp)
- Nhận hoa tiêu làm thuộc hạ ở quán rượu (cần ngôn ngữ chung để nói chuyện)
- Tra cứu đặc sản và người đứng đầu những thành chưa ghé trong sổ tay
- Đọc sách thư viện nếu không ai biết ngôn ngữ của sách

**Càng nói giỏi càng tốt hơn**

- Mặc cả ở thương điếm và chợ, đàm phán ở cổng thành, đòi nợ và đàm phán ngoại giao suôn sẻ hơn.
- Lẻn vào dễ hơn. Thuộc hạ có tiếng mẹ đẻ là ngôn ngữ đó có thể làm người dẫn đường, giúp dễ hơn nữa.
- Thuộc hạ mới tin tưởng bạn hơn ngay từ đầu. Nếu chưa thông thạo, bạn sẽ nghe rằng họ «chưa hoàn toàn mở lòng».
- Đọc được nhiều đoạn sách hơn ở thư viện. Khi ngôn ngữ tiến bộ, đọc lại cùng cuốn sách sẽ được những đoạn còn lại.
- Nếu kế hoạch thám hiểm không có ai biết ngôn ngữ của điểm đến, sẽ có cảnh báo «hãy mang theo thông dịch viên».

### Ngôn ngữ — Cách học · Mang theo thông dịch viên

**Cách học ngôn ngữ**

1. **Tạo Đô đốc** — Bắt đầu thông thạo tiếng mẹ đẻ và ở bậc Bình thường với ngôn ngữ Iberia láng giềng. Điểm còn lại có thể nâng các ngôn ngữ khác; Trí tuệ quyết định học được bao nhiêu.
2. **«Học ngôn ngữ» ở phường hội** — Học ngôn ngữ của thành và các vùng lân cận từng bậc một, tốn tiền và ngày. Trí tuệ cao thì có lợi, bậc càng cao càng khó.
3. **«Làm việc vặt» ở nhà trọ** — Học lỏm tiếng của thành khi làm việc bếp núc và bổ củi. Trí tuệ càng cao học càng nhanh, nhưng danh tiếng giảm chút ít trong lúc làm, và không làm lâu được.
4. **Sống trên cùng một tàu** — Mỗi ngày học được chút ít tiếng mẹ đẻ của thuộc hạ. Tiếng của phó quan ngay bên cạnh tiến bộ nhanh nhất; tiếng của các thuộc hạ khác chậm hơn. Thuộc hạ cũng học tiếng mẹ đẻ của Đô đốc và tiếng của nhau.

**Mang theo thông dịch viên**

- Giao chức **thông dịch viên** cho ai đó trong Bố trí thuộc hạ thì hạm đội dùng ngôn ngữ của người đó (chỉ dùng ngôn ngữ, không dùng kỹ năng).
- Với **phó quan** thì cả kỹ năng lẫn ngôn ngữ đều được dùng.
- Xây **phòng thông dịch** ở xưởng đóng tàu và xếp người vào để có nhiều thông dịch viên — nếu hạm đội đi nhiều vùng biển, hãy mang theo thuộc hạ nói các tiếng khác nhau.
- **Thông dịch trưởng** — Xếp người đã được bổ nhiệm làm thông dịch viên vào phòng thông dịch, người đó sẽ tập hợp ngôn ngữ của Đô đốc và các thuộc hạ trên kỳ hạm vào «sổ thông dịch» và thông dịch tất cả. Với ngôn ngữ mình không biết, họ hỏi người biết rồi dịch kiểu «○○ bảo tôi rằng —», và học ngôn ngữ nhanh hơn các hoa tiêu khác (sổ nằm trong sổ tay của Đô đốc).
- Đầu bếp ở nhà bếp nấu món quê nhà mình — càng nhiều thuộc hạ nói các tiếng khác nhau, bàn ăn trên tàu càng phong phú.

## Phát hiện và báo cáo

### Cửa sổ phát hiện

![Một phát hiện mới](guide/p62_disc)

| # | Mục | Ý nghĩa |
| --- | --- | --- |
| 1 | Hình ảnh | Phát hiện |
| 2 | Tên · Nhãn | Thể loại · vùng · giá trị |
| 3 | Mô tả | Câu chuyện của phát hiện |
| 4 | Danh tiếng | Danh tiếng nhận được ngay tại chỗ phát hiện |
| 5 | OK | Đóng |

Nếu có được thánh tích, sẽ hiện kèm «Đã có thánh tích» — báo cáo cho nhà bảo trợ thì giao nó làm bằng chứng; tự công bố ở cảng thì Đô đốc được giữ.

### Báo cáo hay công bố?

|  | **Báo cáo** cho nhà bảo trợ (cung điện · dinh thự) | **Công bố** ở cảng |
| --- | --- | --- |
| Nhận được | Tiền thưởng + danh tiếng + tín nhiệm | Danh tiếng (danh tiếng phát hiện × 0,9) |
| Thánh tích | Giao làm bằng chứng | Thuộc về Đô đốc |
| Không có bằng chứng | Tiền thưởng ×0,55–0,8, danh tiếng ×0,8 | Danh tiếng ×0,8 |
| Quá hạn | Tiền thưởng ×0,35–0,7, danh tiếng ×0,7 | — |
| Ghi chú | Không có hợp đồng thì từ lần báo cáo thứ hai cho cùng nhà bảo trợ trong cùng năm, tiền thưởng sẽ giảm | Công bố một phát hiện đã ký hợp đồng thì hợp đồng đó thất bại |

- **Cấp bằng chứng**: vật thật ×1,05 · bản vẽ chi tiết ×1,05 (Vẽ bậc 2+) · hải đồ ×1 · phác thảo ×0,95 (Vẽ bậc 1) · lời kể ×0,9. Với phác thảo hoặc lời kể, nhà bảo trợ có thể nghi ngờ.
- **Báo cáo và công bố hàng loạt**: có từ hai phát hiện cần báo cáo thì «Đề xuất phiêu lưu» có «Báo cáo tất cả một lượt», và ở «Công bố» của cảng có thể chọn nhiều cái để công bố cùng lúc.
- **40 hòn đảo nghỉ dưỡng** (thiên nhiên): tìm thấy khi đưa tàu đến gần các đảo như Koh Samui, Maldives, Bali, Seychelles, Santorini, Madeira, Jeju, Tahiti, Bora Bora và Mauritius. Ngay khi tìm thấy, hiệu quả «Kỳ nghỉ» cho mệt mỏi −25 · kỷ luật +8 (hiệu quả «Choáng ngợp» của các phát hiện thiên nhiên khác là −16 · +2).
- **Lọc và sắp xếp theo thể loại**: bấm các nút thể loại phía trên cửa sổ đề xuất, báo cáo hàng loạt và công bố (Tất cả · Địa lý · Thiên nhiên · Di tích · Bảo vật · Sinh vật · Dân tộc · Hàng hóa) để chỉ hiện thể loại đó; «Chọn tất cả đang hiện» chỉ chọn những gì đang hiện. «Sắp xếp» đổi thứ tự theo giá trị, thể loại, tên hoặc mới tìm thấy nhất, và được giữ khi mở lại.
- **Ghim vật phẩm**: bấm vào chiếc ghim trước một vật phẩm trong «Hành trang» của Sổ tay, nhà kho ở tư gia hoặc cửa sổ bán ở chợ để ghim (như mục yêu thích). Vật phẩm đã ghim bị loại khỏi «Chọn tất cả» ở chợ và «Cất tất cả» ở nhà kho, và có thể gom lại bằng nút loại «Đã ghim». Bán hoặc cất đồ vẫn giữ vị trí cuộn của danh sách.
- **Nếu đối thủ công bố trước**: sau này vẫn tìm được tại chỗ, nhưng vinh dự phát hiện đầu tiên thuộc về đối thủ, và danh tiếng cùng tiền thưởng giảm. Hợp đồng với nhà bảo trợ đã ký và manh mối vẫn còn đến hạn chót.

## Công ty đặc quyền và cổ phần

### Khi nào công ty được thành lập

Mỗi thời đại có một công ty mang đặc quyền hoàng gia được thành lập. Khi công ty ra đời, tin tức sẽ đến và một tòa nhà công ty xuất hiện trên đường phố của thành đặt trụ sở.

| Công ty | Thành lập | Trụ sở | Hàng độc quyền |
| --- | --- | --- | --- |
| Casa da Índia (Bồ Đào Nha) | 1501 | Lisboa | Hồ tiêu · Quế · Gừng |
| Casa de Contratación (Tây Ban Nha) | 1503 | Sevilla | Bạc · Vàng · Thuốc nhuộm |
| Công ty Moskva | 1555 | London | Lông thú · Gai dầu |
| Công ty Levant | 1592 | London | Tơ sống · Thảm |
| Công ty Đông Ấn Anh | 1600 | London | Vải bông · Sợi · Trà |
| Công ty Đông Ấn Hà Lan (VOC) | 1602 | Amsterdam | Nhục đậu khấu · Đinh hương · Quế |
| Công ty Tây Ấn Hà Lan | 1621 | Amsterdam | Đường · Lông thú |
| Công ty Đông Ấn Pháp | 1664 | Nantes | Cà phê · Sợi |

- **Trụ sở công ty**: sổ thành viên (gia nhập · thăng cấp) · nhiệm vụ công ty · nộp hàng độc quyền · quầy cổ phần
- **Thương quán** (thành của công ty đó ở hải ngoại): kho công ty · đơn môi giới · nhiệm vụ công ty
- **Sở giao dịch** (Antwerpen 1531–1585 · London 1571– · Amsterdam 1602–): mua bán cổ phần của mọi công ty

### Trở thành thành viên

Gia nhập ở «Sổ thành viên» tại trụ sở bằng cách nộp phí gia nhập (tổng danh tiếng từ 200 trở lên). 80% phí gia nhập trở lại thành cổ phần của công ty đó. Bạn **mỗi lúc chỉ thuộc một công ty**, và nếu rời đi thì một năm không gia nhập được công ty nào.

| Quyền lợi | Chức năng |
| --- | --- |
| Kho công ty | Mua hàng của thương quán với 60% giá thương điếm — đến hạn ngạch theo cấp bậc, làm mới mỗi 60 ngày |
| Nộp hàng độc quyền | Giao hàng độc quyền cho trụ sở với giá thị trường × 1,25–1,4. **Nộp càng nhiều giá càng thấp**, hồi phục sau một hai tháng |
| Đơn môi giới | Chuỗi nối các thương quán và cảng lớn. Mỗi mắt xích tích lũy thưởng chuỗi, và hoàn thành chuỗi được × 1,5 |
| Nhiệm vụ công ty | Tuần tra chống buôn lậu · hạm đội về nước · xây thương quán · đánh chiếm công ty đối thủ (chỉ **công ty của các nước đang thù địch** lúc đó) |
| Hải quan | Nếu không phải thành viên, khoang tàu sẽ bị khám khi mang hàng độc quyền của công ty vào cảng trụ sở |

Khi đóng góp tích lũy, bạn thăng từ thành viên → thuyền trưởng → giám đốc → thống đốc, và hạn ngạch, giá nộp hàng và tiền công nhiệm vụ đều tăng.

### Cổ phần · Góp vốn sáng lập

- Giá cổ phần dao động mỗi tháng, và **cổ tức tự động đến vào mỗi tháng Giêng**. Hạm đội trở về hay chìm, các sự kiện lớn trên thế giới và nhiệm vụ công ty của Đô đốc đều làm giá cổ phần biến động.
- **Giới hạn đầu tư**: số tiền bỏ vào cổ phần (tổng giá mua) tối đa **1.000.000** đồng vàng. Bán đi thì lại mua được chừng đó. Mỗi công ty tối đa 3.000 cổ phần.
- **Góp vốn sáng lập**: tiền nộp trong các sự kiện thành lập ở London (1600), Amsterdam (1602 · 1621) và Paris (1664) trở thành cổ phần của công ty đó. Trong thời hạn góp vốn lịch sử thì nhận theo mệnh giá (500 đồng vàng một cổ phần); góp thêm sau đó thì theo giá ngày hôm đó.
- **Người góp vốn sáng lập**: những ai góp vốn trong thời hạn sẽ trở thành thành viên mà không cần phí gia nhập **trong vòng 10 năm** kể từ khi công ty thành lập, miễn là vẫn giữ toàn bộ số cổ phần nhận được khi đó.
- Các đợt quyết toán đầu tiên (Công ty Đông Ấn Anh 1604 · Công ty Đông Ấn Hà Lan 1610 · Công ty Tây Ấn 1629) chia theo số cổ phần nắm giữ vào ngày đó.
- «Mách nước của người môi giới» ở sở giao dịch cho biết trước tin tức sắp đến, nhưng không phải lúc nào cũng đúng.

## Câu hỏi thường gặp

### Khi bị bế tắc

| Câu hỏi | Trả lời |
| --- | --- |
| Kinh độ hiện «?» trên biển | Cần kính lục phân mới thấy. Vĩ độ hiện khi có thiên bàn hoặc kính lục phân, hoặc Trắc địa bậc 2. Chợ ở cảng nhà luôn có la bàn và kính lục phân |
| Tôi bấm vào cảng mà tự động hải hành không chạy | Tuyến chỉ mở sau khi bạn đi thẳng giữa hai cảng mà không ghé nơi nào khác |
| Tôi không gặp được nhà bảo trợ | Danh tiếng chưa đủ cao. Hãy xin quản gia một việc nhỏ để gây dựng danh tiếng và tín nhiệm |
| Tôi không ra khơi được | Có dưới 5 thủy thủ (hoặc ít hơn 1/3 số tối thiểu), hoặc lương thực hay nước dưới 2 ngày |
| Sách có màu đỏ | Là một trong số: chưa xuất bản · chưa đọc xong các cuốn trước trong bộ · thiếu ngôn ngữ hoặc học vấn · viết về vùng đất bạn chưa biết |
| Có chữ lạ lẫn vào hội thoại | Đó là những từ bạn không nghe ra vì chưa giỏi ngôn ngữ đó. Hãy học qua việc vặt ở nhà trọ hoặc học ngôn ngữ ở phường hội, hoặc mang theo thuộc hạ nói giỏi tiếng đó làm thông dịch viên (các trang ngôn ngữ trong chương «Chỉ số · Kỹ năng · Ngôn ngữ») |
| Làm sao tăng chỉ số? | Tăng dần nhờ kinh nghiệm thuyết phục, buôn bán, chiến đấu, đấu tay đôi, ẩm thực và giao tế, và nhờ các sự kiện lớn như tước vị và hôn nhân. Càng cao càng tăng chậm (trang «Kinh nghiệm và trưởng thành») |
| Tôi không lưu được | Ở độ khó Luật nghiêm, chỉ lưu được ở nhà trọ trong các thành của nước nhà. Kiểm tra xem lưu tự động có đang bật trong Cài đặt không |
| Tôi không biết phải làm gì | Hãy xem «Việc có thể làm ở đây» của thành phố và thẻ «Phát hiện» trong Sổ tay |

Chúc may mắn, Đô đốc. Tiến ra những vùng biển xa hơn!
