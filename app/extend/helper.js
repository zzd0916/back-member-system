'use strict';

const fs = require('fs');
const dbHelper = require('./dbHelper');
const request = require('request');
const utils = require('./utils');
const sms = null;

/**
 * 对错误信息进行过滤处理
 * @param {*} err 错误信息
 * @return {*} 过滤后的错误描述
 */
function filterError(err, app) {
  // app.emit('error', err, this);
  // 数据唯一判断： E11000 duplicate key error index: 1024_CRM.users.$name_1 dup key: { : \"test\" }
  if (err.indexOf('duplicate key error') > -1) {
    let r = err.match(/{([^}]+?)}/ig);
    if (r && r.length) {
      r = r[0].replace(/[{}:"]/g, '');
      return `数据[${r}]重复.`;
    }
    return '数据重复.';
  }
  // 不能为空判断： user validation failed: pwd: 密码不能为空, name: 账号不能为空
  if (err.indexOf('validation failed') > -1) {
    let r = err.match(/(:.+)/ig);
    if (r && r.length) {
      r = r[0].replace(/[a-zA-Z: ]/g, '');
      return r;
    }
    return '数据不能为空.';
  }
  return err;
}

function setRangeSearch(args) {
  const { ctx, power, model } = args;
  if (!ctx) return false;
  /**
   * 权限范围通过用户信息limit确定
   */
  const auth = ctx.helper.auth(ctx.helper.enum.LoginType.Manage);
  const login = auth.getLogin();
  if (!login) return false; // 只验证管理员的操作
  if (!login.limit || !login.limit.shops || !login.limit.shops.length) return false;// 未限制店
  if (!args.search) args.search = {};
  if ('dataShop' === model.modelName) {
    // 获取店列表
    args.search._id = { $in: login.limit.shops };
  }
  const schemas = dbHelper.getSchema(model);
  if (schemas.find(c => c.name === 'shopID')) {
    if (!args.search.$and) args.search.$and = [];
    args.search.$and.push({ $or: [{ shopID: null }, { shopID: { $in: login.limit.shops } }] });
  } else if (schemas.find(c => c.name === 'shop')) {
    if (!args.search.$and) args.search.$and = [];
    args.search.$and.push({ $or: [{ shop: null }, { shop: { $in: login.limit.shops } }] });
  }

  return true;
}

module.exports = {
  sms,
  getLimitDay(mileage) {
    if (!mileage) return null;
    mileage = Math.ceil(mileage / 1000);
    return Math.ceil(mileage / 500) + 1;
  },
  async downfile({ url, file, clearCache = false }){
    const { app } = this;
    file = `${app.baseDir}${file}`;
    if(!clearCache && utils.fsTool.exists(file)){
      return { file };
    }
    // console.log('file:', file);
    
    return new Promise((resolve, reject) => {
      try{
        request(url)
        .on('error', function(err) {
          return resolve({ err: err.message });
        })
        .on('response', function(response) {
          if(response.statusCode !== 200){
            return resolve({ err:'文件不存在' });
          }
        })
        .pipe(fs.createWriteStream(file))
        .on('close', _ => resolve({ file }));
      }catch(err){
        return resolve({ err: err.message });
      }
    });
  },
  utils,
  enum: require('./enum'),
  resp({ state = 1, text, err, data, datas, count = 0, list = [], file, stream, fileName, more } = {}) {
    // console.log('resp:', { text, err, data, count, list, file, stream, fileName });

    const { ctx, app } = this;

    if (err) {
      ctx.body = { state: 0, more, msg: filterError(err, app), err };
      return;
    }

    if (file) {
      if (fileName && fileName.length) ctx.response.attachment(fileName);
      ctx.body = fs.createReadStream(file);
      return;
    }

    if (stream) {
      if (fileName && fileName.length) ctx.response.attachment(fileName);
      ctx.body = stream;
      return;
    }

    if (data) {
      ctx.body = { state, more, data };
      return;
    }

    if (datas) {
      ctx.body = { state, more };
      return;
    }

    if (list) {
      ctx.body = { state, more, count, list };
      return;
    }

    if (text && text.length) {
      ctx.body = text;
      return;
    }

    ctx.body = { state, more };

  },
  auth(loginType) {
    const { ctx } = this;
    return require('./auth')(ctx, loginType);
  },
  db: {
    get(args) {
      // 加入权限范围控制
      // setRangeSearch(args);
      console.log(123)
      return dbHelper.get(args);
    },
    count({ model, search }) {
      return dbHelper.count(model, search);
    },
    list(args) {
      // 加入权限范围控制
      setRangeSearch(args);
      return dbHelper.list(args);
    },
    all(args) {
      // 加入权限范围控制
      setRangeSearch(args);
      return dbHelper.all(args);
    },
    create(args) {
      return dbHelper.create(args);
    },
    save(args) {
      // 加入权限范围控制
      // 如果是修改数据，则验证权限范围
      if (args.data._id) {
        const _args_ = { model: args.model, search: { _id: args.data._id } };
        if (setRangeSearch(_args_)) {
          // 需要验证用户是否有权限删除
          const r = dbHelper.get(_args_);
          if (r.err) return r;
          if (!r.data) return { err: '没有权限修改此数据' };
        }
      }
      return dbHelper.save(args);
    },
    update(args) {
      // 加入权限范围控制
      // 根据传入的更新条件，获取数据_id，再更新
      if (setRangeSearch(args)) {
        // 需要验证用户是否有权限更新
        args.fields = '_id';
        const r = dbHelper.all(args);
        if (r.err) return r;
        if (!r.list || !r.list.length) return { err: '没有权限更新数据' };
        // 只能删除拥有权限的数据
        args.search = r.list.length === 1 ? { _id: r.list[0]._id } : { _id: { $in: r.list.map(d => d._id) } };
      }
      return dbHelper.update(args);
    },
    del(args) {
      // 加入权限范围控制
      // 先用条件限制去获取此数据，如果获取不成功则无权限删除
      // const _args_ = { model: args.model, search: Object.assign({}, args.search), fields: '_id' };
      // 加入权限范围控制
      if (setRangeSearch(args)) {
        // 需要验证用户是否有权限删除
        // 判断用户是批量删除还是单条删除
        // if(args.search._id && args.search._id.$in && args.search._id.$in.length > 1){

        // }
        args.fields = '_id';
        const r = dbHelper.all(args);
        if (r.err) return r;
        if (!r.list || !r.list.length) return { err: '没有权限删除数据' };
        // 只能删除拥有权限的数据
        args.search = r.list.length === 1 ? { _id: r.list[0]._id } : { _id: { $in: r.list.map(d => d._id) } };
      }
      return dbHelper.del(args);
    },
  },
  newGuid() {
    const { app: { mongoose } } = this;
    return mongoose.Types.ObjectId();
  },
  toGuid(id) {
    const { app: { mongoose } } = this;
    return mongoose.Types.ObjectId(id);
  },
  toString(b) {
    if (b === undefined) return b;
    if (typeof b === 'string') return b;
    if (typeof b === 'number') return b + '';
    if (b.toString) return b.toString();
    return JSON.stringify(b);
  },
  toNumber(b) {
    if (b === undefined) return b;
    if (typeof b === 'string') return b * 1;
    return b;
  },
  equal(a, b) {
    if (typeof a === 'string') return a === this.toString(b);
    if (typeof a === 'number') return a === this.toNumber(b);
    return this.toString(a) === this.toString(b);
  },
  delay: time => new Promise(resolve => {
    setTimeout(() => resolve(), time);
  }),
  page: {
    getService(ctx, service) {
      if (service.indexOf('.')) {
        service = service.split('.');
        let m = ctx.service;
        service.forEach(s => { m = m[s]; });
        return m;
      }
      return ctx.service[service];
    },
  },
};
