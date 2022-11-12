module.exports = () => {
  return async (ctx, next) => {
    // 1. 获取请求头中的 token
    let token = ctx.headers.authorization;
    token = token ? token.split('Bearer ')[1] : null;
    // 2. 验证token, 无效返回 401
    if (!token) {
      ctx.throw(401);
    }
    try {
      // 3. token有效根据userId 获取用户数据挂载到ctx给后续中间件使用
      const data = ctx.service.user.verifyToken(token);
      // 根据模型方法查询user信息
      ctx.user = await ctx.model.User.findById(data.userId);
    } catch (error) {
      ctx.throw(401);
    }
    // 4. next 执行后续中间件
    await next();
  };
};
