const { Controller } = require('egg');

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

  // 订阅频道
  async subscribe() {
    const userId = this.ctx.user._id; // 用户id
    const channelId = this.ctx.params.userId; // 频道id
    // 1. 用户不能订阅自己
    // equals(mongoose 内置方法，专用于比对 object._id,内部原理等同于转换字符串比较)
    if (userId.equals(channelId)) {
      this.ctx.throw(422, '用户不能订阅自己');
    }
    // 2. 添加订阅
    const user = await this.service.user.subscribe(userId, channelId);
    // 3. 发送响应
    this.ctx.body = {
      ...this.ctx.helper._.pick(user, [
        'username',
        'email',
        'avatar',
        'cover',
        'channelDescription',
        'subscribersCount',
      ]),
      isSubscribed: true,
    };
  }
  // 取消订阅频道
  async unsubscribe() {
    const userId = this.ctx.user._id; // 用户id
    const channelId = this.ctx.params.userId; // 频道id
    // 1. 用户不能订阅自己
    if (userId.equals(channelId)) {
      this.ctx.throw(422, '用户不能订阅自己');
    }
    // 2. 取消订阅
    const user = await this.service.user.unsubscribe(userId, channelId);
    // 3. 发送响应
    this.ctx.body = {
      ...this.ctx.helper._.pick(user, [
        'username',
        'email',
        'avatar',
        'cover',
        'channelDescription',
        'subscribersCount',
      ]),
      isSubscribed: false,
    };
  }

  // 获取频道用户信息
  async getUser() {
    // 1. 获取订阅状态
    let isSubscribed = false;
    // 如果有登录状态,就获取记录,没有的话,应该是获取其他人的
    if (this.ctx.user) {
      // 获取订阅记录
      const record = await this.app.model.Subscription.findOne({
        user: this.ctx.user._id,
        channel: this.ctx.params.userId,
      });
      if (record) {
        isSubscribed = true;
      }
    }
    // 2. 获取用户信息
    const user = await this.app.model.User.findById(this.ctx.params.userId);
    // 3. 发送响应
    this.ctx.body = {
      ...this.ctx.helper._.pick(user, [
        'username',
        'email',
        'avatar',
        'cover',
        'channelDescription',
        'subscribersCount',
      ]),
      isSubscribed,
    };
  }

  // 获取用户的订阅列表
  async getSubscriptions() {
    // 查数据
    const Subscription = this.app.model.Subscription;
    let subscriptions = await Subscription.find({
      user: this.ctx.params.userId,
    }).populate('channel');
    subscriptions = subscriptions.map(item => {
      return this.ctx.helper._.pick(item.channel, [
        '_id',
        'username',
        'avatar',
      ]);
    });
    this.ctx.body = {
      subscriptions,
    };
  }
}

module.exports = UserController;
