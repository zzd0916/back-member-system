// app/service/user.js
const Service = require('egg').Service;

class UserService extends Service {

  async findUserByPhone(phone) {
    const { ctx } = this;
    try {
        const user = await ctx.model.User.findOne({
            phone,
        });
        return user;
    } catch (err) {
        ctx.body = JSON.stringify(err);
    }
  }

  async findUserById(id) {
    const { ctx } = this;
    try {
        const user = await ctx.model.User.findOne({
            _id,id
        });
        return user;
    } catch (err) {
        ctx.body = JSON.stringify(err);
    }
  }

  /**
   * @name 创建用户
   * @params { phone, sex, name, idCard, birthday, storeId}
  */
  async createUser(userInfo) {
    const { ctx } = this;
    try {
        const user = await ctx.model.User.create(userInfo,(err, data) => {
          if(err) throw err
          console.log(data)
        });
        return user;
    } catch (err) {
        ctx.body = JSON.stringify(err);
    }
  }
}

module.exports = UserService;