# 📱 九一集英社 - Capacitor 手机 APK 打包与下载指南

为了方便您将本系统打包成可在 Android 手机上安装的 **APK 文件**，并在移动端完美使用，我们已经在此代码仓库中**预先安装并配置好了 Capacitor 核心依赖**。

以下是完整的本地打包、调试及签名流程，您可以按照此指南轻松生成属于您的 `.apk` 安装包。

---

## 🛠️ 第一步：前置软件准备

在您的个人电脑（如 Windows、macOS 或 Linux）上进行打包前，请确保您已安装：

1. **Node.js** (推荐 v18+ 或 v20+)：
   - 官方下载：[https://nodejs.org/](https://nodejs.org/)
2. **Android Studio** (安卓官方集成开发环境)：
   - 官方下载：[https://developer.android.google.cn/studio](https://developer.android.google.cn/studio)
   - 安装时请确保勾选了 **Android SDK**、**Android SDK Platform** 和 **Android Virtual Device (模拟器)**。
   - 安装完成后，请打开 Android Studio，并在 `SDK Manager` 中配置好环境变量 `ANDROID_HOME`（指向您的 SDK 路径）。

---

## 🚀 第二步：本地项目初始化与同步

本平台已为您预置了 `@capacitor/core`、`@capacitor/cli` 和 `capacitor.config.ts` 配置文件。在您下载解压导出的项目 ZIP 包后，在项目根目录下依次执行以下命令：

### 1. 安装本地依赖
```bash
npm install
```

### 2. 编译 Web 静态资源
Capacitor 会读取生产环境下编译好的最新 `dist` 网页文件夹。
```bash
npm run build
```

### 3. 初始化 Android 安卓工程
运行此命令会将通用的安卓底层代码框架和原生插件容器引入项目中：
```bash
npx cap add android
```
*(注意：此命令仅需要在最开始执行一次。以后每次修改网页源码，只需调用下面的同步命令。)*

### 4. 同步网页代码到安卓工程
每次当您在本地开发或修改了 React 代码、图标并重新 `npm run build` 后，执行以下命令将最新的 H5/Web 代码和静态配置完全同步至安卓壳子中：
```bash
npx cap sync
```

---

## 💻 第三步：使用 Android Studio 调试与打包

在完成代码同步后，通过以下命令自动唤起 Android Studio 打开本地安卓目录：

```bash
npx cap open android
```

### 1. 模拟器/实机运行与调试
- 等待 Android Studio 底部进度条（Gradle Build）加载并索引完毕。
- **真机调试**：使用 USB 连接您的安卓手机，并在手机设置中开启 **USB 调试** 选项，在 Android Studio 顶部的运行设备列表中选择您的手机，点击绿色的 **▶ (Run App)** 按钮。
- **模拟器调试**：直接在设备管理器（Device Manager）中创建一个虚拟手机并启动运行。

### 2. 生成未签名的测试级 APK (Debug APK)
如果您仅用于个人测试：
- 在 Android Studio 顶部菜单栏点击：`Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`。
- 构建完成后，IDE 底部会弹出提示，点击 `locate` 即可锁定正在生成的 `app-debug.apk` 文件。您可以直接传输到手机上安装。

---

## 🔐 第四步：生成正式签名版发布 APK (Release APK)

如果您需要长期使用，或者避免安卓系统频繁拦截“未知来源安装包”，建议打包一个带有 **私有密钥签名** 的 **Release APK**：

1. 在 Android Studio 菜单栏中点击：`Build` -> `Generate Signed Bundle / APK...`。
2. 在弹出的窗口中选择 **APK**，点击 **Next**。
3. **创建你的签名私盒密码 (Key store path)**：
   - 如果您是第一次打包，点击 **Create new...**。
   - 自行设定存储路径（建议保存在项目根目录下如 `my-release-key.jks`）。
   - 填写密码（记住此密码）、别名 (Alias) 和基本证书信息（可以随便填写英文），点击 OK。
4. **选择构建变体**：
   - 选择 **release** 目标。
   - 勾选 `Signature Versions` 的 **V1 (Jar Signature)** 和 **V2 (Full APK Signature)** 保证最大安卓兼容性。
5. 点击 **Finish**，稍等片刻，您将在本地目录 `android/app/release/` 下找到专属的、加密的高性能原生 Android 安卓版 `app-release.apk` 物理安装包！

---

## 🌟 移动端深度优化细节

为了让本产品在您的 Android 手机上表现如同原生 App 一般精致：
- 我们的 `MobileFrame.tsx` 自适应渲染容器已做好了底层升级。一旦检测到在原生 APK 或窄屏宿主环境启动时，会自动智能去除桌面端多余的“手机样板框”及“边角网格装饰线”，直接铺满系统视口。
- 利用了原生的 `env(safe-area-inset-bottom)` 软键盘与系统下划线避让。
- 支持离线自主密盒 `offline` 直接操作，或者通过您自建的 HTTPS 端口进行高熵 E2EE 数据共享。
