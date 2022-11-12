const Controller = require('egg').Controller;

class UserController extends Controller {
  // 用户创建
  async create() {
    // 1. 数据校验
    const body = this.ctx.request.body;

    this.ctx.validate({
      username: { type: 'string' },
      email: { type: 'email' },
      password: { type: 'string' },
    });
    const userService = this.service.user;

    if (await userService.findByUsername(body.username)) {
      // username已存在
      this.ctx.throw(422, '用户已存在');
    }
    if (await userService.findByEmail(body.email)) {
      // username已存在
      this.ctx.throw(422, '邮箱已存在');
    }

    // 2. 保存用户
    const user = await userService.createUser(body);

    // 3. 生成token
    const token = userService.createToken({
      userId: user._id,
    });

    // 4. 发送响应
    this.ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        token,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }
  // 用户登录
  async login() {
    // 1. 基本数据验证
    const body = this.ctx.request.body;
    this.ctx.validate({
      email: { type: 'email' },
      password: { type: 'string' },
    }, body);
    // 2. 校验邮箱
    const userService = this.service.user;
    const user = await userService.findByEmail(body.email);

    if (!user) {
      this.ctx.throw(422, '用户不存在');
    }
    // 3. 校验密码
    if (this.ctx.helper.md5(body.password) !== user.password) {
      this.ctx.throw(422, '密码不正确');

    }
    // 4. 生成token
    const token = userService.createToken({
      userId: user._id,
    });
    // 5. 发送响应数据
    this.ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        token,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }
  // 获取当前用户信息
  async getCurrentUser() {
    // 1. 验证token
    // 2. 获取用户
    // 3. 发送响应
    const user = this.ctx.user;
    this.ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        token: this.ctx.headers.authorization,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }

  // 更新用户信息
  async update() {
  // 1. 基本数据验证
    const { body } = this.ctx.request;

    this.ctx.validate({
      username: { type: 'string', required: false },
      email: { type: 'email', required: false },
      password: { type: 'string', required: false },
      avatar: { type: 'string', required: false },
      channelDescription: { type: 'string', required: false },
    }, body);
    // 2. 校验用户,邮箱是否已存在
    const userService = this.service.user;
    if (body.username) {
      if (body.username !== this.ctx.user.username && await userService.findByUsername(body.username)) {
        this.ctx.throw(422, '用户名已存在');
      }
    }
    if (body.email) {
      if (body.email !== this.ctx.user.email && await userService.findByEmail(body.email)) {
        this.ctx.throw(422, '用户名已存在');
      }
    }
    // 3. 更新用户信息
    const user = await userService.updateUser(body);
    // 4. 返回更新后的信息
    this.ctx.body = {
      user: {
        email: user.email,
        username: user.username,
        password: user.password,
        avatar: user.avatar,
        channelDescription: user.channelDescription,
      },
    };
  }
}

module.exports = UserController;
