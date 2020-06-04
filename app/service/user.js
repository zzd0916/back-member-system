'use strict';

const serviceUtils = require('../utils/service');

module.exports = class extends serviceUtils.generateDataService({
  model: 'User',
}) {
  async getOne({ search, id }) {
    const { ctx } = this;
    return await ctx.helper.db.get({
      model: ctx.model.User,
      search,
      id,
      populate: [{
        path: 'role', select: 'name level powers',
      }],
    });
  }
  
  async findUserByPhone(phone) {
    const { ctx } = this;
    try {
        // const user =  await ctx.model.User.findOne({
        //   phone,
        // });
        console.log("user", user)
        const user = await this.get({
          search: {
            phone:phone
          }
        });
        return user;
    } catch (err) {
        ctx.body = JSON.stringify(err);
    }
  }
};
