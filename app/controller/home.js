'use strict';

const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const User = this.app.model.User;
    // 向数据库的user文档中写入
    await new User({
      username: 'zax',
      password: '123',
    }).save();
    ctx.body = 'hi, egg';
  }
}

module.exports = HomeController;
