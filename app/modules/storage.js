/**
 * storage.js - 本地配置管理模块
 * ClockMaster - Local Config Management Module
 */

var CONFIG_NAME = "clockmaster_config";

// 创建存储实例
var configStorage = storages.create(CONFIG_NAME);

// 默认配置
var DEFAULT_CONFIG = {
    pushplusToken: "",
    maxRandomDelay: 5,          // 最大随机延迟(分钟)
    targetAppPackage: "",       // 目标App包名
    cloudScriptUrl: "",         // 云端脚本URL
    lastUpdateTime: 0,          // 上次更新时间
    debugMode: false            // 调试模式
};

var Storage = {
    /**
     * 获取所有配置
     * @returns {Object} 完整配置对象
     */
    getAll: function() {
        var config = {};
        for (var key in DEFAULT_CONFIG) {
            config[key] = configStorage.get(key, DEFAULT_CONFIG[key]);
        }
        return config;
    },

    /**
     * 获取单个配置项
     * @param {string} key - 配置键名
     * @param {*} defaultValue - 默认值(可选)
     * @returns {*} 配置值
     */
    get: function(key, defaultValue) {
        if (defaultValue === undefined && DEFAULT_CONFIG.hasOwnProperty(key)) {
            defaultValue = DEFAULT_CONFIG[key];
        }
        return configStorage.get(key, defaultValue);
    },

    /**
     * 设置单个配置项
     * @param {string} key - 配置键名
     * @param {*} value - 配置值
     */
    set: function(key, value) {
        configStorage.put(key, value);
    },

    /**
     * 批量设置配置
     * @param {Object} configObj - 配置对象
     */
    setAll: function(configObj) {
        for (var key in configObj) {
            if (configObj.hasOwnProperty(key)) {
                configStorage.put(key, configObj[key]);
            }
        }
    },

    /**
     * 重置为默认配置
     */
    reset: function() {
        configStorage.clear();
        this.setAll(DEFAULT_CONFIG);
    },

    /**
     * 检查配置是否完整
     * @returns {Object} {valid: boolean, missing: string[]}
     */
    validate: function() {
        var missing = [];
        var config = this.getAll();

        // 必填项检查
        if (!config.pushplusToken || config.pushplusToken.trim() === "") {
            missing.push("PushPlus Token");
        }
        if (!config.cloudScriptUrl || config.cloudScriptUrl.trim() === "") {
            missing.push("云端脚本URL");
        }
        if (!config.targetAppPackage || config.targetAppPackage.trim() === "") {
            missing.push("目标App包名");
        }

        return {
            valid: missing.length === 0,
            missing: missing
        };
    },

    /**
     * 导出配置为JSON字符串
     * @returns {string} JSON配置
     */
    exportConfig: function() {
        return JSON.stringify(this.getAll(), null, 2);
    },

    /**
     * 从JSON字符串导入配置
     * @param {string} jsonStr - JSON配置字符串
     * @returns {boolean} 是否成功
     */
    importConfig: function(jsonStr) {
        try {
            var config = JSON.parse(jsonStr);
            this.setAll(config);
            return true;
        } catch (e) {
            console.error("导入配置失败: " + e.message);
            return false;
        }
    }
};

module.exports = Storage;
