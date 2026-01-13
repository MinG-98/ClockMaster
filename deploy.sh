#!/bin/bash

# ClockMaster 部署脚本
# 用于将项目传输到 Android 设备

echo "=========================================="
echo "ClockMaster 部署工具"
echo "=========================================="
echo ""

# 检查 ADB 是否可用
if ! command -v adb &> /dev/null; then
    echo "❌ 错误: 未找到 adb 命令"
    echo "请安装 Android SDK Platform-Tools"
    echo "Ubuntu: sudo apt install adb"
    exit 1
fi

# 检查设备连接
echo "🔍 检查设备连接..."
DEVICE_COUNT=$(adb devices | grep -w "device" | wc -l)

if [ $DEVICE_COUNT -eq 0 ]; then
    echo "❌ 未检测到 Android 设备"
    echo ""
    echo "请确保："
    echo "1. 手机已通过 USB 连接到电脑"
    echo "2. 手机已开启 USB 调试模式"
    echo "3. 已在手机上授权此电脑"
    exit 1
fi

echo "✅ 检测到设备"
adb devices
echo ""

# 目标路径
TARGET_DIR="/sdcard/脚本/ClockMaster"

echo "📁 创建目标目录..."
adb shell "mkdir -p $TARGET_DIR"
adb shell "mkdir -p $TARGET_DIR/app"
adb shell "mkdir -p $TARGET_DIR/app/modules"
adb shell "mkdir -p $TARGET_DIR/app/assets"
adb shell "mkdir -p $TARGET_DIR/cloud"

echo "📤 传输文件..."

# 传输主文件
adb push project.json "$TARGET_DIR/"
adb push README.md "$TARGET_DIR/"
adb push CHANGELOG.md "$TARGET_DIR/"

# 传输 app 目录
adb push app/main.js "$TARGET_DIR/app/"

# 传输 modules
adb push app/modules/storage.js "$TARGET_DIR/app/modules/"
adb push app/modules/permission.js "$TARGET_DIR/app/modules/"
adb push app/modules/launcher.js "$TARGET_DIR/app/modules/"
adb push app/modules/scheduler.js "$TARGET_DIR/app/modules/"
adb push app/modules/history.js "$TARGET_DIR/app/modules/"
adb push app/modules/pushplus.js "$TARGET_DIR/app/modules/"
adb push app/modules/utils.js "$TARGET_DIR/app/modules/"
adb push app/modules/ui_pres.js "$TARGET_DIR/app/modules/"

# 传输 cloud
adb push cloud/core_task.js "$TARGET_DIR/cloud/"

echo ""
echo "✅ 传输完成！"
echo ""
echo "📱 下一步："
echo "1. 在手机上打开 Auto.js Pro"
echo "2. 浏览到: $TARGET_DIR"
echo "3. 打开 app/main.js 并运行"
echo ""
echo "=========================================="
