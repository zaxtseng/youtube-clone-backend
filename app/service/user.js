const Service = require('egg').Service;
const jwt = require('jsonwebtoken');

class UserService extends Service {
  get User() {
    return this.app.model.User;
  }

  findByUsername(username) {
    return this.User.findOne({
      username,
    });
  }
  findByEmail(email) {
    return this.User.findOne({
      email,
    }).select('+password');
  }

  async createUser(data) {
    data.password = this.ctx.helper.md5(data.password);
    const user = new this.User(data);
    // 保存到数据库中
    await user.save();
    return user;
  }

  createToken(data) {
    return jwt.sign(data, this.app.config.jwt.secret, {
      expiresIn: this.app.config.jwt.expiresIn,
    });
  }

  // 验证token
  verifyToken(token) {
    return jwt.verify(token, this.app.config.jwt.secret);
  }
  // 更新用户信息
  updateUser(data) {
    return this.User.findByIdAndUpdate(this.ctx.user._id, data, {
      new: true, // 返回更新之后的数据
    });
  }

  // 添加订阅
  async subscribe(userId, channelId) {
    const { Subscription, User } = this.app.model;
    // 1. 检查是否已经订阅
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });

    const user = await User.findById(channelId);
    // 2. 没有订阅,添加
    if (!record) {
      await new Subscription({
        user: userId,
        channel: channelId,
      }).save();
      // 更新用户订阅数量
      user.subscribersCount++;
      await user.save(); // 更新到数据库
    }
    // 3. 返回用户信息
    return user;
  }
  // 取消订阅
  async unsubscribe(userId, channelId) {
    const { Subscription, User } = this.app.model;
    // 1. 检查是否已经订阅
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });

    const user = await User.findById(channelId);
    // 2. 有订阅,删除
    if (record) {
      await record.remove();
      // 更新用户订阅数量
      user.subscribersCount--;
      await user.save(); // 更新到数据库
    }
    // 3. 返回用户信息
    return user;
  }
}

module.exports = UserService;
