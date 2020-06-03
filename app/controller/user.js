'use strict'

const Controller = require('egg').Controller

class UserController extends Controller {

    /**
     * @name user login
     * @params 
     * {
     *  phone: 手机号
     *  code: 验证码
     * } 
    */
    async login() {
        const { ctx } = this;
        let phone = ctx.request.body.phone || null;
        if (!phone || String(phone).length < 8) {
            ctx.body = {
                success: false,
                errCode: '0000001',
                errMsg: '参数错误,请仔细检查参数问题'
            }
            return
        }
        // console.log("service",ctx.service)
        const data = await ctx.service.user.findUserByPhone(phone);
        if (!data) {
            ctx.body = {
                success: false,
                errCode: '0000002',
                errMsg: '该手机还未注册会员'
            }
            return
        }
        ctx.body = {
            success: true,
            data: data
        }
    }

    /**
     * @name user info
     * @params id
    */
    async getUserInfoById(id) {
        const { ctx } = this;
        id = id || ctx.request.body.id;
        const data = await ctx.service.user.findUserById(id);
        if (!data) {
            ctx.body = {
                success: false,
                errCode: '0000002',
                errMsg: '未查到该用户信息'
            }
            return
        }
        ctx.body = {
            success: true,
            data: data
        }
    }

    /**
     * @name user register
     * @params id
    */
    async createUser() {
        const { ctx } = this;
        const { phone } = ctx.request.body;
        const userInfo = await ctx.service.user.findUserByPhone(phone);
        if (userInfo) {
            ctx.body = {
                success: false,
                errCode: '0000002',
                errMsg: `${phone}-该手机号已被注册`
            }
            return
        }
        let data = await ctx.service.user.createUser(ctx.request.body);
        console.log(data,'data')
        if (!data) {
            ctx.body = {
                success: false,
                errCode: '0000002',
                errMsg: '用户注册失败，请联系管理员'
            }
            return
        }
        ctx.body = {
            success: true,
            data: data
        }
    }

}

module.exports = UserController