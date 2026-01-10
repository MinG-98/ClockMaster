/**
 * launcher.js - 热更新引擎模块
 * ClockMaster - Hot Update Engine Module
 */

var Storage = require("./storage.js");

// 本地备份路径
var BACKUP_DIR = "/sdcard/ClockMaster/";
var BACKUP_SCRIPT_PATH = BACKUP_DIR + "backup_core.js";
var VERSION_FILE_PATH = BACKUP_DIR + "version.json";

var Launcher = {
    // 状态回调
    onStatusChange: null,

    /**
     * 设置状态回调
     * @param {Function} callback - (status: string) => void
     */
    setStatusCallback: function(callback) {
        this.onStatusChange = callback;
    },

    /**
     * 发送状态更新
     * @param {string} status - 状态信息
     */
    updateStatus: function(status) {
        log(status);
        if (this.onStatusChange) {
            this.onStatusChange(status);
        }
    },

    /**
     * 确保备份目录存在
     */
    ensureBackupDir: function() {
        if (!files.exists(BACKUP_DIR)) {
            files.createWithDirs(BACKUP_DIR);
        }
    },

    /**
     * 计算字符串的简单哈希值
     * @param {string} str - 输入字符串
     * @returns {string} 哈希值
     */
    simpleHash: function(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    },

    /**
     * 解析脚本头部的版本信息
     * 格式: // @version 1.0.0
     * @param {string} content - 脚本内容
     * @returns {Object} {version: string, hash: string}
     */
    parseScriptMeta: function(content) {
        var versionMatch = content.match(/@version\s+([\d.]+)/);
        var version = versionMatch ? versionMatch[1] : "0.0.0";
        var hash = this.simpleHash(content);

        return {
            version: version,
            hash: hash
        };
    },

    /**
     * 保存版本信息
     * @param {Object} meta - 版本元信息
     */
    saveVersionInfo: function(meta) {
        try {
            this.ensureBackupDir();
            var versionInfo = {
                version: meta.version,
                hash: meta.hash,
                updateTime: new Date().getTime()
            };
            files.write(VERSION_FILE_PATH, JSON.stringify(versionInfo, null, 2));
        } catch (e) {
            log("保存版本信息失败: " + e.message);
        }
    },

    /**
     * 读取本地版本信息
     * @returns {Object|null}
     */
    getLocalVersionInfo: function() {
        try {
            if (files.exists(VERSION_FILE_PATH)) {
                return JSON.parse(files.read(VERSION_FILE_PATH));
            }
        } catch (e) {
            log("读取版本信息失败: " + e.message);
        }
        return null;
    },

    /**
     * 比较版本号
     * @param {string} v1 - 版本1
     * @param {string} v2 - 版本2
     * @returns {number} 1: v1>v2, -1: v1<v2, 0: equal
     */
    compareVersion: function(v1, v2) {
        var parts1 = v1.split('.').map(Number);
        var parts2 = v2.split('.').map(Number);

        for (var i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            var p1 = parts1[i] || 0;
            var p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    },

    /**
     * 从URL获取远程脚本 (带重试)
     * @param {string} url - 脚本URL
     * @param {number} retries - 重试次数
     * @returns {Object|null} {content, meta} 或 null
     */
    fetchRemoteScript: function(url, retries) {
        retries = retries || 3;
        var self = this;

        for (var attempt = 1; attempt <= retries; attempt++) {
            self.updateStatus("获取云端脚本 (尝试 " + attempt + "/" + retries + ")...");

            try {
                var response = http.get(url, {
                    headers: {
                        "User-Agent": "ClockMaster/1.0",
                        "Cache-Control": "no-cache",
                        "Accept": "text/plain, application/javascript"
                    },
                    timeout: 15000
                });

                if (response.statusCode === 200) {
                    var content = response.body.string();

                    // 验证脚本基本格式
                    if (!content || content.length < 100) {
                        self.updateStatus("脚本内容过短，可能无效");
                        continue;
                    }

                    // 检查是否包含必要标记
                    if (content.indexOf("ClockMaster") === -1) {
                        self.updateStatus("脚本格式验证失败");
                        continue;
                    }

                    var meta = self.parseScriptMeta(content);
                    self.updateStatus("获取成功 v" + meta.version + " (" + content.length + " bytes)");

                    return {
                        content: content,
                        meta: meta
                    };
                } else {
                    self.updateStatus("HTTP " + response.statusCode);
                }
            } catch (e) {
                self.updateStatus("网络错误: " + e.message);
            }

            // 重试前等待
            if (attempt < retries) {
                sleep(1000 * attempt);
            }
        }

        return null;
    },

    /**
     * 保存脚本备份
     * @param {string} content - 脚本内容
     * @param {Object} meta - 版本元信息
     */
    saveBackup: function(content, meta) {
        try {
            this.ensureBackupDir();
            files.write(BACKUP_SCRIPT_PATH, content);
            this.saveVersionInfo(meta);
            Storage.set("lastUpdateTime", new Date().getTime());
            log("备份已保存: v" + meta.version);
        } catch (e) {
            log("保存备份失败: " + e.message);
        }
    },

    /**
     * 加载本地备份脚本
     * @returns {Object|null} {content, meta} 或 null
     */
    loadBackup: function() {
        this.updateStatus("加载本地备份...");

        try {
            if (files.exists(BACKUP_SCRIPT_PATH)) {
                var content = files.read(BACKUP_SCRIPT_PATH);
                if (content && content.length > 100) {
                    var meta = this.getLocalVersionInfo() || this.parseScriptMeta(content);
                    this.updateStatus("本地备份 v" + meta.version);
                    return {
                        content: content,
                        meta: meta
                    };
                }
            }
            this.updateStatus("无可用备份");
            return null;
        } catch (e) {
            this.updateStatus("加载失败: " + e.message);
            return null;
        }
    },

    /**
     * 智能获取脚本 (检查更新)
     * @param {string} url - 远程脚本URL
     * @returns {Object} {success, content, source, version}
     */
    getScript: function(url) {
        var localData = this.loadBackup();
        var localVersion = localData ? localData.meta.version : "0.0.0";

        // 尝试获取远程脚本
        var remoteData = this.fetchRemoteScript(url);

        if (remoteData) {
            var remoteVersion = remoteData.meta.version;

            // 检查是否需要更新
            if (this.compareVersion(remoteVersion, localVersion) >= 0) {
                // 远程版本更新或相同，使用远程
                this.saveBackup(remoteData.content, remoteData.meta);
                return {
                    success: true,
                    content: remoteData.content,
                    source: "remote",
                    version: remoteVersion,
                    updated: this.compareVersion(remoteVersion, localVersion) > 0
                };
            } else {
                // 本地版本更高(异常情况)，仍使用远程
                this.updateStatus("警告: 本地版本较新，使用云端版本");
                this.saveBackup(remoteData.content, remoteData.meta);
                return {
                    success: true,
                    content: remoteData.content,
                    source: "remote",
                    version: remoteVersion,
                    updated: false
                };
            }
        }

        // 远程获取失败，回退到本地
        if (localData) {
            this.updateStatus("使用本地备份 v" + localVersion);
            return {
                success: true,
                content: localData.content,
                source: "local",
                version: localVersion,
                updated: false
            };
        }

        return {
            success: false,
            content: null,
            source: "none",
            version: null,
            updated: false
        };
    },

    /**
     * 执行脚本
     * @param {string} scriptContent - 脚本内容
     * @param {Object} config - 配置对象
     * @returns {Object} {success, executionId}
     */
    executeScript: function(scriptContent, config) {
        this.updateStatus("启动核心任务...");

        try {
            var execution = engines.execScript("ClockMaster_Core", scriptContent, {
                arguments: {
                    config: config,
                    launchTime: new Date().getTime(),
                    launcherVersion: "1.0.0"
                }
            });

            if (execution) {
                this.updateStatus("任务已启动 (ID: " + execution.id + ")");

                execution.on("stop", function() {
                    log("核心任务执行完毕");
                });

                return {
                    success: true,
                    executionId: execution.id
                };
            } else {
                this.updateStatus("任务启动失败");
                return { success: false, executionId: null };
            }
        } catch (e) {
            this.updateStatus("执行错误: " + e.message);
            console.error(e);
            return { success: false, executionId: null };
        }
    },

    /**
     * 完整启动流程
     * @param {Object} config - 配置对象
     * @returns {boolean} 是否成功
     */
    launch: function(config) {
        config = config || Storage.getAll();

        // 验证配置
        var validation = Storage.validate();
        if (!validation.valid) {
            this.updateStatus("配置不完整: " + validation.missing.join(", "));
            return false;
        }

        // 获取脚本
        var result = this.getScript(config.cloudScriptUrl);

        if (!result.success) {
            this.updateStatus("无法获取脚本，请检查网络");
            return false;
        }

        if (result.updated) {
            this.updateStatus("已更新到 v" + result.version);
        }

        // 执行脚本
        var execResult = this.executeScript(result.content, config);
        return execResult.success;
    },

    /**
     * 检查脚本可用性
     * @returns {Object}
     */
    checkAvailability: function() {
        var hasBackup = files.exists(BACKUP_SCRIPT_PATH);
        var versionInfo = this.getLocalVersionInfo();
        var lastUpdate = Storage.get("lastUpdateTime", 0);

        return {
            available: hasBackup,
            version: versionInfo ? versionInfo.version : null,
            lastUpdate: lastUpdate,
            lastUpdateStr: lastUpdate > 0 ? new Date(lastUpdate).toLocaleString() : "从未更新"
        };
    },

    /**
     * 强制更新脚本
     * @param {string} url - 脚本URL
     * @returns {boolean} 是否成功
     */
    forceUpdate: function(url) {
        this.updateStatus("强制更新...");
        this.clearBackup();

        var remoteData = this.fetchRemoteScript(url);
        if (remoteData) {
            this.saveBackup(remoteData.content, remoteData.meta);
            this.updateStatus("更新完成 v" + remoteData.meta.version);
            return true;
        }

        this.updateStatus("更新失败");
        return false;
    },

    /**
     * 清除本地备份
     */
    clearBackup: function() {
        try {
            if (files.exists(BACKUP_SCRIPT_PATH)) {
                files.remove(BACKUP_SCRIPT_PATH);
            }
            if (files.exists(VERSION_FILE_PATH)) {
                files.remove(VERSION_FILE_PATH);
            }
            Storage.set("lastUpdateTime", 0);
            this.updateStatus("备份已清除");
        } catch (e) {
            this.updateStatus("清除失败: " + e.message);
        }
    }
};

module.exports = Launcher;
