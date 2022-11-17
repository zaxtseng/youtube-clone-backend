const { Controller } = require('egg');

class VideoController extends Controller {
  async createVideo() {
    const body = this.ctx.request.body;
    const { Video } = this.app.model;
    // 校验数据
    this.ctx.validate({
      title: { type: 'string' },
      description: { type: 'string' },
      vodVideoId: { type: 'string' },
    }, body);
    body.user = this.ctx.user._id;
    const video = await new Video(body).save();

    this.ctx.status = 201;
    this.ctx.body = {
      video,
    };
  }

  // 获取视频信息
  async getVideo() {
    const { Video, Like, Show, Comment, Subscription } = this.app.model;
    const { videoId } = this.ctx.params;
    let video = await Video.findById(videoId).populate('user', '_id username avatar subscribersCount');
    console.log('video: ', video);

    if (!video) {
      this.ctx.throw(404, 'Video Not Found');
    }
    // 将video转成json
    video = video.toJSON();
    video.isLiked = false; // 是否喜欢
    video.isDisliked = false; // 是否不喜欢
    video.user.isSubscribed = false; // 是否已订阅视频作者

    if (this.ctx.user) {
      const userId = this.ctx.user._id;
      if (await Like.findOne({ user: userId, video: videoId, like: 1 })) {
        video.isLiked = true;
      }
      if (await Like.findOne({ user: userId, video, like: -1 })) {
        video.isDisliked = true;
      }
      if (await Subscription.findOne({ user: userId, channel: video.user._id })) {
        video.user.isSubscribed = true;
      }
    }
    this.ctx.body = { video };
  }

  // 获取视频列表
  async getVideos() {
    const { Video } = this.app.model;
    let { pageSize = 1, pageNum = 10 } = this.ctx.query;
    pageSize = Number.parseInt(pageSize);
    pageNum = Number.parseInt(pageNum);
    // 查询列表
    const getVideos = Video.find().populate('user').sort({
      createdAt: -1,
    })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments();
    const [ videos, videosCount ] = await Promise.all([ getVideos, getVideosCount ]);
    this.ctx.body = {
      videos,
      videosCount,
    };
  }
  // 获取用户视频列表
  async getUserVideos() {
    const { Video } = this.app.model;
    let { pageSize = 10, pageNum = 1 } = this.ctx.query;
    const { userId } = this.ctx.params;
    pageSize = Number.parseInt(pageSize);
    pageNum = Number.parseInt(pageNum);
    // 查询列表
    const getVideos = Video.find({ user: userId }).populate('user').sort({
      createdAt: -1,
    })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments({ user: userId });
    const [ videos, videosCount ] = await Promise.all([ getVideos, getVideosCount ]);
    this.ctx.body = {
      videos,
      videosCount,
    };
  }
}

module.exports = VideoController;
