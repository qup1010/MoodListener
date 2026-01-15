# 🎨 应用图标更新指南

## 新图标设计

我们采用了一款 **现代极简风格 (Swiss Style)** 的图标：
- **设计理念**：两个咬合的几何形态，象征"心情"与"倾听"的连接。
- **配色**：深天蓝 (Sky Blue) + 冰蓝 (Ice Blue) + 纯白背景。
- **风格**：扁平化、几何感、专业。

## 📦 资源位置

- **源文件**：`resources/icon.png` (已保存)
- **Web图标**：`public/icon.png` (已更新)

## 🛠️ 自动生成流程 (正在进行)

我们使用 `@capacitor/assets` 工具自动生成所有 Android 适配图标：

1. **安装工具**：
   ```bash
   npm install @capacitor/assets --save-dev
   ```

2. **生成资源**：
   ```bash
   npx @capacitor/assets generate --android
   ```
   *这将自动替换 `android/app/src/main/res/` 下所有的 `mipmap` 图标文件。*

3. **应用变更**：
   ```bash
   npx cap sync android
   ```

## 📱 验证方法

1. **Web端**：
   - 刷新浏览器，标签页图标应变为新图标。
   - 如果未变，请清除浏览器缓存。

2. **Android端**：
   - 重新部署应用到手机。
   - 手机桌面的应用图标应更新为新版本。

---

> **注意**：如果自动生成失败，我们将指导您手动替换或检查环境配置。
