---
description: 构建并部署 Android 应用
---

# Android 构建工作流

## 日常开发（推荐）

在浏览器中进行开发和调试：
```bash
npm run dev
```
浏览器中的功能已通过 localStorage 模拟，可以正常测试大部分逻辑。

---

## 同步到 Android（仅需 2 步）

当您修改了前端代码，想要更新到 Android 应用时：

// turbo
1. 构建并同步：
```bash
npm run build; npx cap sync android
```

// turbo
2. 在 Android Studio 中点击 **Run ▶️** 按钮

> 如果 Android Studio 已经打开，直接执行上述命令后点 Run 即可，无需重新打开。

---

## 首次设置（仅需一次）

1. 安装 Android Studio
2. 运行 `npx cap open android` 打开项目
3. 等待 Gradle 同步完成
4. 创建模拟器或连接真机

---

## 生成 APK 安装包

```bash
npm run build
npx cap sync android
```
然后在 Android Studio 中：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`

APK 位置：`android/app/build/outputs/apk/debug/app-debug.apk`
