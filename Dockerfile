# 使用node镜像
FROM node:14.21.0-alpine
# 在容器中新建目录文件夹 egg
RUN mkdir -p /egg
# 将 /egg 设置为默认工作目录
WORKDIR /egg
# 环境变量
ENV NODE_ENV=production
# 将 package.json 复制默认工作目录
COPY package.json /egg/package.json
# 安装依赖
RUN npm config set register https://registry.npm.taobao.org
# 只安装dependencies的包
RUN npm i --production
# 再copy代码至容器
COPY ./ /egg
# 7001端口
EXPOSE 7001
#等容器启动之后执行脚本
CMD npm start