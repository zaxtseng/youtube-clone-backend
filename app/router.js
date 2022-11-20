'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  const auth = app.middleware.auth();
  router.prefix('/api/v1'); // 设置基础路径

  router.post('/users', controller.user.create);
  router.post('/users/login', controller.user.login);
  router.get('/user', auth, controller.user.getCurrentUser);
  router.patch('/user', auth, controller.user.update);
  router.get('/users/:userId', app.middleware.auth({ required: false }), controller.user.getUser);
  // 用户订阅
  router.post('/users/:userId/subscribe', auth, controller.user.subscribe);
  router.delete('/users/:userId/subscribe', auth, controller.user.unsubscribe);
  router.get('/users/:userId/subscriptions', controller.user.getSubscriptions);

  // VOD视频服务
  router.get('/vod/createUploadVideo', auth, controller.vod.createUploadVideo);
  router.post('/videos', auth, controller.video.createVideo);// 创建视频
  router.get('/videos/:videoId', app.middleware.auth({ required: false }), controller.video.getVideo);// 获取视频详情
  router.get('/videos', controller.video.getVideos);
  router.get('/users/:userId/videos', controller.video.getUserVideos); // 获取用户发布的视频列表
  router.get('/users/videos/feed', auth, controller.video.getUserFeedVideos); // 获取用户关注的频道视频列表
  router.patch('/videos/:videoId', auth, controller.video.updateVideo); // 修改视频
  router.delete('/videos/:videoId', auth, controller.video.deleteVideo); // 修改视频
  router.post('/videos/:videoId/comments', auth, controller.video.createComment); // 创建视频评论
  router.get('/videos/:videoId/comments', controller.video.getVideoComment); // 获取视频评论
  router.delete('/videos/:videoId/comments/:commentId', auth, controller.video.deleteVideoComment); // 删除视频评论
  router.post('/videos/:videoId/like', auth, controller.video.likeVideo); // 点赞视频
  router.post('/videos/:videoId/dislike', auth, controller.video.dislikeVideo); // 点踩视频
  router.get('/user/videos/liked', auth, controller.video.getUserLikedVideos); // 获取用户喜欢的视频列表
};
