 <h1 align="center">Hi 👋, I'm Mob</h1>
<h3 align="center">Join the Cryptocurrency Market, make money from Airdrop - Retroactive with me</h3>

- <p align="left"> <img src="https://komarev.com/ghpvc/?username=mobonchain&label=Profile%20views&color=0e75b6&style=flat" alt="mobonchain" /> <a href="https://github.com/mobonchain"> <img src="https://img.shields.io/github/followers/mobonchain?label=Follow&style=social" alt="Follow" /> </a> </p>

- [![TopAME | Bullish - Cheerful](https://img.shields.io/badge/TopAME%20|%20Bullish-Cheerful-blue?logo=telegram&style=flat)](https://t.me/xTopAME)

# Hướng Dẫn Cài Đặt và Sử Dụng **Fractal AI Tool**

## Yêu Cầu:
1. Đăng ký **[2captcha](https://2captcha.com/)** nạp 3$ vào tài khoản
- Mở tệp `main.js` lên tìm kiếm `const API_KEY = "YOUR_API_KEY";` thay **YOUR_API_KEY** bằng **API Key** từ **2captcha** của bạn
2. Đăng ký tài khoản trên **[Fractal AI](https://dapp.fractionai.xyz/?referral=DA0D6A15)**
3. Tạo thành công **2 Agent** trong tài khoản của bạn
4. Cài đặt **[Node.js](https://nodejs.org/en)** trên máy tính hoặc VPS của bạn

---

## Cấu Trúc File Dữ Liệu

1. **proxy.txt**:
   - Mỗi dòng chứa một proxy theo định dạng:
     ```
     https://username:pass@host:port
     ```

2. **wallet.txt**:
   - Mỗi dòng chứa một private key của ví Ethereum (không cần kèm địa chỉ ví).
   - Định dạng:
     ```
     PrivateKey1
     PrivateKey2
     ```

---

## Cài Đặt Trên Windows

### Bước 1: Tải và Giải Nén File

1. Nhấn vào nút **<> Code"** màu xanh lá cây, sau đó chọn **Download ZIP**.
2. Giải nén file ZIP vào thư mục mà bạn muốn lưu trữ.

### Bước 2: Cấu Hình Proxy và Wallet

1. Tạo file `proxy.txt` và thêm danh sách proxy của bạn theo định dạng đã chỉ định.
2. Tạo file `wallet.txt` và nhập private key của các ví Ethereum bạn muốn sử dụng.

### Bước 3: Cài Đặt Module

1. Mở **Command Prompt (CMD)** hoặc **PowerShell** trong thư mục chứa mã nguồn.
2. Cài đặt các module yêu cầu bằng lệnh:
   ```bash
   npm install
   ```

### Bước 4: Chạy Tool

1. Chạy chương trình bằng lệnh:
   ```bash
   node main.js
   ```
2. Tool sẽ bắt đầu xử lý các ví và proxy theo thứ tự.

---

## Cài Đặt Trên Linux (VPS)

### Bước 1: Tạo Phiên `screen`

1. Đăng nhập vào VPS của bạn qua SSH.

2. Tạo một phiên `screen` mới để chạy công cụ **Fractal AI** mà không bị gián đoạn khi bạn rời khỏi terminal:

   ```bash
   screen -S FractalAI
   ```

### Bước 2: Git Clone Dự Án

   ```bash
   git clone https://github.com/mobonchain/FractalAI.git
   cd FractalAI
   ```

### Bước 3: Cài Đặt Node.js và NPM

1. Kiểm tra xem Node.js và npm đã được cài đặt chưa:

   ```bash
   node -v
   npm -v
   ```

   Nếu chưa cài đặt, bạn có thể cài Node.js và npm bằng các lệnh sau (cho **Ubuntu/Debian**):

   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```

   Đối với các hệ điều hành khác, hãy tham khảo tài liệu chính thức của **[Node.js](https://nodejs.org/en/)**.

### Bước 4: Cài Đặt Các Module

1. Sau khi clone về, chạy lệnh sau để cài đặt các module yêu cầu:

   ```bash
   npm install
   ```

### Bước 5: Cấu Hình Proxy

1. Tạo file `proxy.txt` và thêm danh sách proxy của bạn theo định dạng đã chỉ định.

   ```bash
   nano proxy.txt
   ```
2. Thêm thông tin proxy của bạn theo định dạng sau:
   ```
   https://username:pass@host:port
   ```
3. Lưu file bằng tổ hợp phím **Ctrl + O**, sau đó thoát bằng **Ctrl + X**.

### Bước 6: Cấu Hình Wallet

1. Tạo file `wallet.txt` và nhập private key của các ví Ethereum bạn muốn sử dụng.

   ```bash
   nano wallet.txt
   ```
2. Thêm thông tin ví của bạn theo định dạng sau:
    ```
     PrivateKey1
     PrivateKey2
     ```
3. Lưu file bằng tổ hợp phím **Ctrl + O**, sau đó thoát bằng **Ctrl + X**.

### Bước 7: Chạy Ứng Dụng

1. Sau khi cài đặt xong các module và cấu hình, chạy ứng dụng bằng lệnh:

   ```bash
   node main.js
   ```

### Bước 8: Để Ứng Dụng Chạy Tiếp Tục Sau Khi Đăng Xuất

Khi bạn muốn để ứng dụng chạy trong nền và không bị gián đoạn khi đăng xuất khỏi phiên SSH, bạn có thể tách khỏi phiên `screen` bằng cách nhấn `Ctrl + A` rồi nhấn `D`.

Để quay lại phiên `screen` đã tạo, bạn chỉ cần chạy lệnh:

```bash
screen -r FractalAI
```

Chúc bạn cài đặt thành công **Fractal AI Tool** trên **Windows** và **Linux (VPS)**. Nếu gặp phải bất kỳ vấn đề nào có thể hỏi thêm tại **[TopAME | Chat - Supports](https://t.me/yTopAME)**
