'use strict';

const Service = require('egg').Service;

const getModel = (ctx, model) => {
  if (model.indexOf('.')) {
    model = model.split('.');
    let m = ctx.model;
    model.forEach(s => {
      m = m[s];
    });
    return m;
  }

  return ctx.model[model];
};

module.exports.generateDataService = ({
  model,
  defaultSort = {
    createTime: -1
  },
  powers,
  defaultPopulate,
  defaultFields
}) => class extends Service {

  // 保存数据
  async save({
    data,
    power = powers
  }) {
    const {
      ctx
    } = this;
    if (Object.keys(data).length === 0) {
      return {
        err: '数据为空'
      };
    }
    return ctx.helper.db.save({
      ctx,
      power,
      model: getModel(ctx, model),
      data,
    });
  }

  // 获取所有记录
  async all({
    search,
    power = powers,
    sort = defaultSort,
    fields = defaultFields,
    populate = defaultPopulate
  } = {}) {
    const {
      ctx
    } = this;
    // console.log('service-all:', search);
    return ctx.helper.db.all({
      ctx,
      power,
      model: getModel(ctx, model),
      search,
      sort,
      fields,
      populate
    });
  }

  // 获取单条记录
  async get({
    id,
    search,
    power = powers,
    sort = defaultSort,
    fields = defaultFields,
    populate = defaultPopulate
  }) {
    const {
      ctx
    } = this;

    return ctx.helper.db.get({
      ctx,
      power,
      model: getModel(ctx, model),
      search,
      id,
      sort,
      fields,
      populate
    });
  }

  // 获取一个分页的列表
  async list({
    page = 1,
    search = {},
    match,
    power = powers,
    pageSize,
    sort = defaultSort,
    fields = defaultFields,
    populate = defaultPopulate
  } = {}) {
    const {
      ctx,
      config
    } = this;
    // console.log('service-list:', ctx.request.url, fields, populate);
    if (!pageSize) pageSize = config.site.pageSize;

    // 设置 populate查询的match
    if (populate && populate.length && match && typeof match === 'object') {
      populate.forEach(p => {
        if (match[p.path]) p.match = match[p.path];
      });
    }
    // console.log('list-1:', page, pageSize);

    return ctx.helper.db.list({
      ctx,
      power,
      model: getModel(ctx, model),
      ps: pageSize,
      p: page,
      search,
      fields,
      populate,
      sort
    });
  }

  // 设置 (data._id 为条件，多个id用逗号隔开)
  async set({
    data,
    search,
    incData,
    power = powers
  }) {
    const {
      ctx
    } = this;

    // console.log('set', data, !data._id , typeof data._id , (Object.keys(data).length === 1 && !incData));
    if (!search) {
      if (!data._id || (typeof data._id !== 'object' && !data._id.length) || (Object.keys(data).length === 1 && !incData)) {
        return {
          err: '参数错误'
        };
      }

      const _id = data._id;
      delete data._id;
      search = {
        _id
      };
      if (_id.length > 24) {
        search = {
          _id: {
            $in: _id.split(',')
          }
        };
      }
    }
    // console.log('service-set:', data, incData);
    return ctx.helper.db.update({
      ctx,
      power,
      model: getModel(ctx, model),
      search,
      data,
      incData
    });
  }

  // 如果ID 是多条（逗号隔开）则批量删除
  async del({
    _id,
    search,
    power = powers
  }) {
    if ((!_id || !_id.length) && !search) {
      return {
        err: '参数错误'
      };
    }
    const {
      ctx
    } = this;
    if (!search) {
      search = {
        _id
      };
      if (_id.length > 24) {
        search = {
          _id: {
            $in: _id.split(',')
          }
        };
      }
    }
    return ctx.helper.db.del({
      ctx,
      power,
      model: getModel(ctx, model),
      search
    });
  }
};