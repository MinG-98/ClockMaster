#!/bin/bash
# ClockMaster 一键同步脚本
# 自动推送到 GitHub 和 Gitee

echo "========================================"
echo "🚀 ClockMaster 代码同步"
echo "========================================"
echo ""

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo "📝 检测到未提交的更改："
    git status -s
    echo ""

    # 添加所有更改
    echo "📦 添加所有更改..."
    git add .

    # 提交
    echo ""
    read -p "📝 请输入提交信息: " commit_msg
    if [[ -z "$commit_msg" ]]; then
        commit_msg="更新代码"
    fi

    git commit -m "$commit_msg

    echo "✅ 提交完成"
else
    echo "ℹ️  没有新的更改需要提交"
fi

echo ""
echo "========================================"
echo "📤 推送到远程仓库..."
echo "========================================"

# 推送到 GitHub
echo ""
echo "🐙 推送到 GitHub..."
if git push origin main; then
    echo "✅ GitHub 推送成功"
else
    echo "❌ GitHub 推送失败"
    exit 1
fi

# 推送到 Gitee
echo ""
echo "🦊 推送到 Gitee..."
if git push gitee main; then
    echo "✅ Gitee 推送成功"
else
    echo "❌ Gitee 推送失败"
    exit 1
fi

echo ""
echo "========================================"
echo "🎉 所有远程仓库同步完成！"
echo "========================================"
echo ""
echo "📍 仓库地址："
echo "  GitHub: https://github.com/MinG-98/ClockMaster"
echo "  Gitee:  https://gitee.com/MinG-98/ClockMaster"
echo ""
