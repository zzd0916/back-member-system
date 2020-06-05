const Service = require('egg').Service;

class BaseService extends Service {
    async sendCode() {
        const { ctx } = this
        return await ctx.helper.getRandomNumber(6);
    }

    setSession(key, data) {
        const { ctx } = this
        if (data) {
            ctx.session[key] =data
        }
    }

    geSession(key) {
        const { ctx } = this
        if (key) return ctx.session[key]
    }
}

module.exports = BaseService;