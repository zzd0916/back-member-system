'use strict';

const Controller = require('egg').Controller;

// respFn 输出前对数据进行处理
module.exports.generateDataController = ({
  service, // 服务
  filters = { name: 0 }, // 查询条件处理
  match,
  keyword = ['name', 'phone'], // 查询条件处理
  preSaveFn, // 进入保存处理前的函数
  savePreFn, // 保存前处理函数
}) => class extends Controller {
  // 获取列表, 支持名称和电话模糊匹配
  async list({ power, needReture = false, query } = {}) {
    const { ctx } = this;
    // console.log('controller-list:', ctx.request.url);
    
    if (!query) query = ctx.query;
    const page = query.p;
    // console.log('list-query:', query, queries);
    const search = ctx.helper.utils.getSearch(query, filters);
    if (query.$or) {
      search.$and = [{ $or: query.$or }];
    }
    if (query.$and) {
      if (!search.$and) search.$and = [];
      search.$and.push({ $and: query.$and });
    }
    if (keyword && keyword.length && query.keyword && query.keyword.length) {
      // 处理查询条件里的 keyword
      const $or = [];
      keyword.forEach(key => {
        if (!query[key] || !query[key].length) {
          const condition = {};
          condition[key] = ctx.helper.utils.getConditionValue(0, query.keyword);
          $or.push(condition);
        }
      });
      if ($or.length) {
        if (!search.$and) search.$and = [];
        search.$and.push({ $or });
        // search.$or = $or;
      }
    }
    // 设置match
    if (match && typeof match === 'object') {
      for (const key in match) {
        match[key] = ctx.helper.utils.getSearch(query, match[key]);
      }
    }
    // console.log('controller-list:', ctx.request.url, JSON.stringify(search), query);
    // 权限 shops
    
    // if(ctx.request.power){
    //   const { shops } = ctx.request.power;
    //   if(shops && shops.length){
    //     search.shopID = { $in: shops };
    //   }
    // }
    // console.log('controller-list:', ctx.request.url, ctx.request.power, JSON.stringify(search), query);
    const r = await ctx.helper.page.getService(ctx, service).list({
      page,
      search,
      match,
      pageSize: query.ps*1,
      power,
    });
 
    if (needReture) return r;
    ctx.helper.resp(r);
  }

  // 保存， 名称不可重复
  async save({ power, needReture = false } = {}) {
    const { ctx } = this;
    const { body: data } = ctx.request;

    if (typeof preSaveFn === 'function') {
      const rpsf = await preSaveFn(ctx, data);
      if(rpsf && rpsf.err) {
        if (needReture) return rpsf;
        return ctx.helper.resp(rpsf);
      }
    }

    const auth = ctx.helper.auth(ctx.helper.enum.LoginType.Manage);
    const login = auth.getLogin();

    if (!data._id) {
      data.createBy = !login ? null : login._id; // 创建人
      data.createTime = new Date(); // 创建时间
    } else {
      data.updateBy = !login ? null : login._id; // 修改人
      data.updateTime = new Date(); // 修改时间
    }

    if (typeof savePreFn === 'function') {
      const rspf = await savePreFn(ctx, data);
      if(rspf && rspf.err) {
        if (needReture) return rspf;
        return ctx.helper.resp(rspf);
      }
    }
    const r = await ctx.helper.page.getService(ctx, service).save({ data, power });

    if (needReture) return r;
    ctx.helper.resp(r);
  }

  // 批量设置
  async set({ power } = {}) {
    const { ctx } = this;
    const { body: data } = ctx.request;
    if (!data._id || !data._id.length || Object.keys(data).length === 1) {
      return ctx.helper.resp({ err: '参数错误' });
    }
    ctx.helper.resp(await ctx.helper.page.getService(ctx, service).set({ data, power }));
  }

  // 删除（支持批量删除：逗号隔开多个ID）
  async del({ power } = {}) {
    const { ctx } = this;
    const { _id } = ctx.request.body;
    if (!_id) {
      ctx.helper.resp({ err: '参数错误' });
      return;
    }
    ctx.helper.resp(await ctx.helper.page.getService(ctx, service).del({ _id, power }));
  }

};
