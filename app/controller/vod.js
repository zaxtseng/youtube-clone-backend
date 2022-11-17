'use strict';

const { Controller } = require('egg');

const { VodUploadClient, VodUploadRequest } = require('vod-node-sdk');


class VodController extends Controller {
  async createUploadVideo() {
    const query = this.ctx.query;
    this.ctx.validate({
      Title: { type: 'string' },
      FileName: { type: 'string' },
    }, query);

    const { accessKeyId, accessKeySecret } = this.app.config.vod;

    const client = new VodUploadClient(accessKeyId, accessKeySecret);
    const req = new VodUploadRequest();

    req.MediaFilePath = `data/file/${query.FileName}`;
    req.MediaName = query.Title;

    const data = await client.upload('ap-guangzhou', req, function(err, data) {
      if (err) {
        // 处理业务异常
        console.log(err);
      } else {
        // 获取上传成功后的信息
        console.log(data.FileId);
        console.log(data.MediaUrl);
        return data;
      }
    });
    this.ctx.body = { data };
  }
}

module.exports = VodController;
