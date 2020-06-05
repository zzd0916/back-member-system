/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {
    security: {
      csrf: {
        enable: false
      }
    }
  };

  // connet mongodb
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1/member_db',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
      // mongoose global plugins, expected a function or an array of function and options
      // plugins: [createdPlugin, [updatedPlugin, pluginOptions]],
    },
  };

  config.jwt = {
    secret: "member_system"//自定义 token 的加密条件字符串
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1591149213136_5090';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };
  
  return {
    ...config,
    ...userConfig,
  };
};

