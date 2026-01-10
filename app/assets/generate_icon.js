/**
 * generate_icon.js - 图标生成脚本
 * 运行此脚本生成应用图标
 *
 * 使用方法: 在 Auto.js 中运行此文件
 */

var iconPath = "/sdcard/ClockMaster/icon.png";

// 创建 192x192 的图标
var icon = images.createImage(192, 192);
var canvas = new android.graphics.Canvas(icon.getBitmap());

// 背景
var bgPaint = new android.graphics.Paint();
bgPaint.setColor(android.graphics.Color.parseColor("#4CAF50"));
bgPaint.setAntiAlias(true);
canvas.drawCircle(96, 96, 90, bgPaint);

// 时钟外圈
var circlePaint = new android.graphics.Paint();
circlePaint.setColor(android.graphics.Color.WHITE);
circlePaint.setStyle(android.graphics.Paint.Style.STROKE);
circlePaint.setStrokeWidth(6);
circlePaint.setAntiAlias(true);
canvas.drawCircle(96, 96, 70, circlePaint);

// 时钟指针
var handPaint = new android.graphics.Paint();
handPaint.setColor(android.graphics.Color.WHITE);
handPaint.setStrokeWidth(6);
handPaint.setStrokeCap(android.graphics.Paint.Cap.ROUND);
handPaint.setAntiAlias(true);

// 时针 (指向10点)
canvas.drawLine(96, 96, 70, 60, handPaint);

// 分针 (指向2点)
handPaint.setStrokeWidth(4);
canvas.drawLine(96, 96, 130, 50, handPaint);

// 中心点
canvas.drawCircle(96, 96, 8, circlePaint);

// 保存图标
files.createWithDirs(iconPath);
images.save(icon, iconPath);
icon.recycle();

toast("图标已生成: " + iconPath);
log("图标生成完成: " + iconPath);
log("请将此文件复制到 app/assets/icon.png");
