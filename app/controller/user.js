'use strict';

const controllerUtils = require('../utils/controller');

module.exports = class extends controllerUtils.generateDataController({
  service: 'user',
}) {

  // async logs() {
  //   const { ctx } = this;
  //   const { query } = ctx;
  //   ctx.helper.resp(await ctx.service.system.user.get({
  //     page: query.p, pageSize: query.ps,
  //     search: ctx.helper.utils.getSearch(query, { realName: 0, time: 'd-range' }),
  //   }));
  //   ctx.helper.resp(await ctx.service.user.logs({name: 1}));
  // }
  // async test() {
  //   const { ctx } = this;
  //   const { phone, code } = ctx.request.query;
  //   const data = await ctx.service.user.all();
  //   ctx.helper.resp(data);
  // }

  async login() {
    const { ctx } = this;
    const { phone, code } = ctx.request.body;
    let vData = ctx.service.base.geSession('userLogin');
    if(!vData) {
      return ctx.body = {
        success: false,
        errMsg: '请发送验证码到手机'
      }
    }
    console.log(vData,'vData')
    if(vData.phone != phone || vData.code != code) {
      return ctx.body = {
        success: false,
        errMsg: '验证码不正确'
      }
    } 

    let data = await ctx.service.user.findUserByPhone(phone)
    if(data.data) {
      // 删除session
      delete ctx.session.userLogin;
      // 生成token
      const token = ctx.app.jwt.sign({
        ...ctx.request.body,
      }, this.app.config.jwt.secret, {
        expiresIn: '60m', // 时间根据自己定，具体可参考jsonwebtoken插件官方说明
      })
      ctx.helper.resp({...data, token});
      return
    }
    return ctx.body = {
      success: false,
      errMsg: '该手机号还未注册会员'
    }
  }

  async register() {
    const { ctx } = this;
    let form = ctx.request.body;
    // 默认pwd 为手机号后6位
    if(form.phone) {
      form.pwd = form.phone.substring(form.phone.length-6);
    }
    const data = await ctx.service.user.createUser(form)
    ctx.helper.resp({...data});
  }
};
