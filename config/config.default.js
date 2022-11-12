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
  config.middleware = [ 'errorHandler' ];

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
   * 配置jwt
   */
  config.jwt = {
    secret: '8968db1c-be91-42cd-aec7-1da118348f3b',
    expiresIn: '1d', // 1d是1天
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
