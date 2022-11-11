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
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1668151389872_9511';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };


  /**
   * egg-mongoose
   */
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1/youtube-clone',
      options: { useUnifiedTopology: true },
      plugins: [],
    },
  };

  /**
   * 暂时关闭csrf
   */

  config.security = {
    csrf: {
      enable: false,
    },
  };
  // 设置跨域请求
  // config.cors = {
  //   // 默认所有的地址都可以跨域请求
  //   origin: '*',
  //   // {string|Function} origin: '*',
  //   // {string|Array} allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  // };

  return {
    ...config,
    ...userConfig,
  };
};
