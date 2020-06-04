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
  async test() {
    const { ctx } = this;
    const { phone, code } = ctx.request.query;
    const data = await ctx.service.user.all();
    ctx.helper.resp(data);
  }
  async login() {
    const { ctx } = this;
    const { phone, code } = ctx.request.body;
    const data = await ctx.service.user.findUserByPhone(phone)
    ctx.helper.resp(data);
  }
};
