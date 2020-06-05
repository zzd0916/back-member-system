'use strict';

const Controller = require('egg').Controller;

class ServiceController extends Controller {

  // 发送验证码
  async sendCode() {
    const { ctx } = this;
    const { phone } = ctx.request.body;
    if (!phone || phone.length < 8) {
      ctx.body = {
        success: false,
        errMsg: '手机号不正确'
      }
      return
    }

    // 发送验证码
    const code = await ctx.service.base.sendCode();
    if (!code) {
      ctx.body = {
        success: false,
        errMsg: '发送验证码失败'
      }
      return
    }

    // 验证码存入seesion
    ctx.service.base.setSession('userLogin', {
      phone,
      code
    })

    ctx.body = {
      success: true
    }
  }
}

module.exports = ServiceController;
