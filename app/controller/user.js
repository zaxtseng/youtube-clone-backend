const Controller = require('egg').Controller;

class UserController extends Controller {
  async create() {
    this.ctx.body = 'user create';
  }
}

module.exports = UserController;
