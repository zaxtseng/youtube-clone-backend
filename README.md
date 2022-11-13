# youtubeclone-backend



## QuickStart

<!-- add docs here for user -->


### 初始化

```bash
pnpm create egg --type=simple -r=https://registry.npmmirror.com/
pnpm install
```
### 配置mongoose
```bash
pnpm add egg-mongoose
```
```js
// config/plugin.js
exports.mongoose = {
  enable: true,
  package: 'egg-mongoose',
};
```

```js
// config.default.js
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1/youtube-clone',
      options: {},
      plugins: [],
    },
  };
  ```
### 不使用 exports 的原因
require 导入的是 module.exports 导出的对象，这个配置文件中的 module.exports 导出的是一个函数，**(这个文件中的 module.exports 默认的引用地址已经改变了，而 exports 的没有改变，仍然指向的是一个空对象)；**当使用 exports.mongoose 的时候，exports 导出的对象不会被 require 的方式导入，所以配置无效.

  ### 定义模型model
  新建`app/model/user.js`.
  ```js
  module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const UserSchema = new Schema({
    username: { type: String },
    password: { type: String },
  });

  return mongoose.model('User', UserSchema);
};
```
### 使用model
```js
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
```
### 数据模型设计
新建`model`下文件,`comment`,`like`,`show`,`subscription`,`video`,等SChema文件.
```js
// app/model/comment.js
module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const commentSchema = new Schema({
    content: { // 评论内容
      type: String,
      required: true,
    },
    user: { // 评论用户
      type: mongoose.ObjectId,
      ref: 'User',
      required: true,
    },
    video: { // 评论视频
      type: mongoose.ObjectId,
      ref: 'Video',
      required: true,
    },
    createdAt: { // 创建时间
      type: Date,
      default: Date.now,
    },
    updatedAt: { // 更新时间
      type: Date,
      default: Date.now,
    },
  });

  return mongoose.model('Comment', commentSchema);
};
```
### 配置路由
```js
// app/router.js
module.exports = app => {
  const { router, controller } = app;
  router.prefix('/api/v1'); // 设置基础路径

  router.post('users', controller.user.create);
};
```
### 暂时关闭csrf
```js
//app/config/config.default.js
  config.security = {
    csrf: {
      enable: false,
    },
  };
```

### 定义UserController
```js
// app/controller/user.js
const Controller = require('egg').Controller;

class UserController extends Controller {
  async create() {
    this.ctx.body = 'user create';
  }
}

module.exports = UserController;
```
### 数据流程
1. 数据校验
2. 保存用户
3. 生成token
4. 发送响应

### 数据校验
使用插件`egg-validate`.通过`ctx.validate(rule, [body])`.
```bash
pnpm add egg-validate
```
```js
//config/plugin.js
exports.validate = {
  enable: true,
  package: 'egg-validate'
}
```
### 统一异常处理(中间件)
新建`middleware/error_handler.js`,
```js
// app/middleware/error_handler.js
module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
      // 所有的异常都在 app 上触发一个 error 事件，框架会记录一条错误日志
      ctx.app.emit('error', err, ctx);

      const status = err.status || 500;
      // 生产环境时 500 错误的详细错误内容不返回给客户端，因为可能包含敏感信息
      const error =
        status === 500 && ctx.app.config.env === 'prod'
          ? 'Internal Server Error'
          : err.message;

      // 从 error 对象上读出各个属性，设置到响应中
      ctx.body = { error };
      if (status === 422) {
        ctx.body.detail = err.errors;
      }
      ctx.status = status;
    }
  };
};
```
```js
// app/config/config.default.js
config.middleware = ['errorHandler']
```
### 封装业务方法
新建`app/service`.
```js
// app/service/user.js
const Service = require('egg').Service;

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
    });
  }

  createUser() {}
}

module.exports = UserService;
```
### 添加存在验证
```js
// app/controller/user.js
if (await this.service.user.findByUsername(body.username)) {
    // username已存在
    this.ctx.throw(422, '用户已存在');
  }
  if (await this.service.user.findByEmail(body.email)) {
    // username已存在
    this.ctx.throw(422, '邮箱已存在');
  }
```
### 添加方法加密
新建`app/extend/helper.js`
```js
const crypto = require('crypto');

exports.md5 = str => {
  return crypto.createHash('md5').update(str).digest('hex');
};
// 第二种写法
// module.exports = {
//   md5(str) {
//     return crypto.createHash('md5').update(str).digest('hex');
//   },
// };
```
### 封装用户信息
```js
//app/service/user.js
async createUser(data) {
  data.password = this.ctx.helper.md5(data.password);
  const user = new this.User(data);
  // 保存到数据库中
  await user.save();
  return user;
}
```
### 添加token
`pnpm add jsonwebtoken`
#### 配置jwt
```js
//config/config.default.js
config.jwt = {
  // 这里使用vscode插件uuid generator,使用ctrl+P,调用uuid,自动生成
  secret: 'xxxx',
  expiresIn: '1d', // 1d是1天
}
```
```js
// app/service/user.js
createToken(data) {
  jwt.sign(data, this.app.config.jwt.secret, {
    expiresIn: this.app.config.jwt.expiresIn,
  });
}
```

```js
// 生成token
const token = await this.service.user.createToken({
  userId: user._id,
});
```
### 用户登录
1. 基本数据验证
2. 校验邮箱
3. 校验密码
4. 生成token
5. 发送响应数据
#### 增加路由
```js
// router.js
router.post('/users/login', controller.user.login)
```
#### 用户登录
```js
async login() {
  // 1. 基本数据验证
  const body = this.ctx.request.body;
  this.ctx.validate({
    email: { type: 'email' },
    password: { type: 'string' },
  }, body);
```
#### 校验邮箱
```js
const userService = this.service.user;
const user = await userService.findByEmail(body.email);

if (!user) {
  this.ctx.throw(422, '用户不存在');
}
```
#### 校验密码
注意: 因为在Schema中设置了`select: false, // 查询中不包含该字段`,
所以查询的时候需要加上`select('+password')`才能查到密码.
### 获取当前登录用户
接口设计: GET请求

所需参数: header中的 `Authorization` 字段,即token.

返回参数: user中相关字段.

步骤:
1. 验证token
2. 获取用户
3. 发送响应
#### 添加路由
```js
// router.js
router.get('/user', controller.user.getCurrentUser);
```
#### controller中添加getCurrentUser方法
```js
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
```

#### 中间件(身份认证)
因为很多地方需要身份认证,所以封装到中间件中,统一处理.

基本步骤:   
1. 获取请求头中的 token
2. 验证token, 无效返回 401
3. token有效根据userId 获取用户数据挂载到ctx给后续中间件使用
4. next 执行后续中间件
```js
// middleware/auth.js
module.exports = () => {
  return async (ctx, next) => {
    // 1. 获取请求头中的 token
    let token = ctx.headers.Authorization;
    token = token ? token.split('Bearer ')[1] : null;
    // 2. 验证token, 无效返回 401
    if (!token) {
      ctx.throw(401);
    }
    try {
      // 3. token有效根据userId 获取用户数据挂载到ctx给后续中间件使用
      const data = ctx.service.verityToken(token);
      // 根据模型方法查询user信息
      ctx.user = await ctx.model.User.findById(data.userId);
    } catch (error) {
      ctx.throw(401);
    }
    // 4. next 执行后续中间件
    await next();
  };
};
```
验证token的方法成功会解析出数据,失败会抛出错误,使用try/catch捕获.
```js
// app/service/user.js
// 验证token
verifyToken(token) {
  return jwt.verify(token, this.app.config.jwt.secret);
}
```
按需加载这个中间件
```js
// router.js
const auth = app.middleware.auth()

router.get('/user', auth, controller.user.getCurrentUser);
```
### 更新用户信息
步骤
1. 基本数据验证
2. 校验用户,邮箱是否已存在
3. 更新用户信息
4. 返回更新后的信息

添加路由
```js
//  router.js
router.patch('/user', auth, controller.user.update);
```
更新数据库用户信息
```js
//service.js
// 更新用户信息
updateUser(data) {
  return this.User.findByIdAndUpdate(this.ctx.user._id, data, {
    new: true, // 返回更新之后的数据
  });
}
```
```js
// controller/user.js
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
    if (body.username !== this.ctx.user.username && await userService.findByUsername(body.user.username)) {
      this.ctx.throw(422, '用户名已存在');
    }
  }
  if (body.email) {
    if (body.email !== this.ctx.user.mail && await userService.findByEmail(body.mail)) {
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
```
### 频道订阅
1. 订阅频道(用户)
2. 取消订阅频道(用户)
3. 获取用户(频道)

#### 订阅接口
```js
// router.js
router.post('/users/:userId/subscribe',auth, controller.user.subscribe);
```
#### 接口设计
1. 用户不能订阅自己
2. 添加订阅
3. 发送响应
#### 订阅的service
1. 检查是否已经订阅
2. 没有订阅,添加
3. 返回用户信息
```js
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
```
#### 订阅的Controller
```js
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
    ...user.toJSON(),
    isSubscribed: true,
  };
}
```
### 安装lodash
使用其中的`pick`方法,为了给前端参数的时候,可以更方便的提供出对应的参数.
```sh
pnpm add lodash
```
挂载全局
```js
//extend/helper.js
const _ = require("lodash")

exports._ = _
```
修改返回响应体
```js
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
}
```
### 取消订阅频道(用户)
#### 接口设计
```js
// router.js
router.delete('/users/:userId/subscribe', auth, controller.user.unsubscribe);
```
### service和Controller设计
取消订阅和订阅的方法基本没什么变化,需要变化的有下面几处.
```js
// Controller/user.js
isSubscribed: false,

//service/user.js
// 2. 有订阅,删除
if (record) {
  await record.remove();
  // 更新用户订阅数量
  user.subscribersCount--;
  await user.save(); // 更新到数据库
}
```
### 获取频道用户信息
#### 接口设计
```js
// router.js
router.get('/users/:userId', auth, controller.user.getUser);
```
#### Controller
1. 获取订阅状态
2. 获取用户信息
3. 发送响应
```js
// 获取用户信息
async getUser() {
  // 1. 获取订阅状态
  let isSubscribed = false;
  // 如果有登录状态,就获取记录,没有的话,应该是获取其他人的
  if (this.ctx.user) {
    // 获取订阅记录
    const record = await this.app.model.Subscription.findOne({
      user: this.ctx.user._id,
      channel: this.ctx.params.userId,,
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
```
#### 修改中间件auth
```js
module.exports = (options = { required: true }) => {
  return async (ctx, next) => {
    // 1. 获取请求头中的 token
    let token = ctx.headers.authorization;
    token = token ? token.split('Bearer ')[1] : null;
    // 2. 验证token, 无效返回 401
    if (token) {
      try {
        // 3. token有效根据userId 获取用户数据挂载到ctx给后续中间件使用
        const data = ctx.service.user.verifyToken(token);
        // 根据模型方法查询user信息
        ctx.user = await ctx.model.User.findById(data.userId);
      } catch (error) {
        ctx.throw(401);
      }
    } else if (options.required) {
      ctx.throw(401);
    }
    // 4. next 执行后续中间件
    await next();
  };
};
```
### 获取用户的订阅列表
```js
// router.js
router.get('/users/:userId/subscriptions', controller.user.getSubscriptions);
};
```
#### controller
```js
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
```