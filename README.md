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
