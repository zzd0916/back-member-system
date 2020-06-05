'use strict';

/**
 * 数据库操作参数检查
 * @param {*} model 数据模型
 * @return {*} 验证结构
 */
const baseCheck = ({ model }) => {
  if (typeof model !== 'function') {
    return { err: 'model is invalid.' };
  }
  return null;
};
/**
 * 创建单条或多条数据
 * @param {*} model 数据模型
 * @param {*} data 数据(对象 或 数组)
 * @param {*} dup 重复检查条件
 * @param {*} dupTit 重复提示名称
 * @return {*} 查询结果
 */
module.exports.create = ({ model, data, dup, dupTit }) => {

  const check = baseCheck({ model });
  if (check) return check;
  if (typeof data !== 'object') return { err: 'data is invalid.' };

  return (dup ? model.findOne(dup, { _id: 1 }) : Promise.resolve())
    .then(doc => {
      if (doc) return { err: `${dupTit ? dupTit : '数据'}已经存在` };
      return model.create(data);
    })
    .then(datas => {
      if (datas.err) return datas;
      // 插入后的数据，如果是插入单个数据则为对象，如果是多条数据则为数组
      return { datas };
    })
    .catch(err => { return { err: err.message }; });

};

/**
 * 更新单条或多条数据
 * @param {*} model 数据模型
 * @param {*} search 查询条件
 * @param {*} data 需要更新的数据
 * @param {*} incData 需要累加更新的数据
 * @param {*} isMany 是否更新符合条件的多条数据
 * @param {*} isAdd 如果数据不存在是否新增
 * @param {*} dup 重复检查条件
 * @param {*} dupTit 重复提示名称
 * @return {*} 操作结果
 */
const update = ({ model, search, data, incData, isMany = true, isAdd = false, dup, dupTit }) => {

  const check = baseCheck({ model });
  if (check) return check;
  if (typeof data !== 'object' && typeof incData !== 'object') return { err: 'update data is invalid.' };

  const updData = {};
  if (data) {
    updData.$set = data;
  }
  if (incData) {
    updData.$inc = incData;
  }
  // console.log('dbhelper:', search, updData);

  return (dup ? model.findOne(dup, { _id: 1 }) : Promise.resolve())
    .then(doc => {
      if (doc) return { err: `${dupTit ? dupTit : '数据'}已经存在` };
      return model.update(search, updData, { multi: isMany, upsert: isAdd });
    })
    .then(({ nModified }) => {
      if (nModified.err) return nModified;
      // { ok, nModified, n } 操作结果，影响记录数
      return { num: nModified };
    })
    .catch(err => { return { err: err.message }; });
};
module.exports.update = update;

/**
 * 保存数据: 新增 或 更新 (如果包含 _id 属性)
 * @param {*} model 数据模型
 * @param {*} data 数据(document对象[从数据库获取的对象，有save方法] 或 普通对象)
 * @param {*} dup 重复检查条件
 * @param {*} dupTit 重复提示名称
 * @return {*} 操作结果
 */
module.exports.save = ({ model, data, dup, dupTit }) => {
  // console.log('save:', model, data);

  const check = baseCheck({ model });
  if (check) return check;

  if (typeof data !== 'object') return { err: 'save data is invalid.' };
  
  if (typeof data.save === 'function') {
    return new Promise((resolve, reject) => data.save(err => {
      if (err) reject({ err: err.message });
      resolve({});
    }));
  }

  if (data._id) {
    const _id = data._id;
    delete data._id;
    return update({ model, data, search: { _id }, isMany: false, dup, dupTit });
  }

  return (dup ? model.findOne(dup, { _id: 1 }) : Promise.resolve())
    .then(doc => {
      if (doc) return { err: `${dupTit ? dupTit : '数据'}已经存在` };
    //  console.log("create");
      return model.create(data);
    })
    .then(datas => {
      // console.log("datas", datas)
      if (datas.err) return datas;
      return { datas };
    })
    .catch(err => {
      // console.log("catch",err); 
      return { err: err.message }; 
    });

};

/**
 * 删除单条或多条数据
 * @param {*} model 数据模型
 * @param {*} search 查询条件
 * @return {*} 操作结果
 */
module.exports.del = ({ model, search }) => {

  const check = baseCheck({ model });
  if (check) return check;

  if (typeof search !== 'object') return { msg: 'no delete condition!' };

  return model.remove(search)
    .then(({ result }) => {
      return { num: result.n, err: result.n === 0 ? '删除数据不存在' : null };
    })
    .catch(err => { return { err: err.message }; });
};

/**
 * 获取单条数据
 * @param {*} model 数据模型
 * @param {*} search 查询条件
 * @param {*} id 查询条件(ID限制)
 * @param {*} sort 排序
 * @param {*} fields 返回字段
 * @param {*} populate 连接查询
 * @return {*} 查询结果
 */
module.exports.get = ({ model, id, sort, fields, search, populate }) => {

  const check = baseCheck({ model });
  if (check) return check;
  // console.log('get:', id, typeof id);
  if ((!id || (typeof id === 'string' && id.length !== 24)) && (!search || typeof search !== 'object')) return { err: 'id and search is null!' };

  let query = id ? model.findById(id, fields) : model.findOne(search, fields);
  
  if (sort && typeof sort === 'object') {
    query = query.sort(sort);
  }

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => { query = query.populate(p); });
    } else {
      query = query.populate(populate);
    }
  }
  return query.exec()
    .then(data => { return { data }; })
    .catch(err => { return { err: err.message }; });
};

/**
 * 获取符合条件的所有数据
 * @param {*} model 数据模型
 * @param {*} search 查询条件
 * @param {*} sort 排序
 * @param {*} fields 返回字段
 * @param {*} populate 连接查询
 * @return {*} 查询结果
 */
module.exports.all = ({ model, sort, fields, search, populate }) => {

  const check = baseCheck({ model });
  if (check) return Promise.reject(check);

  let query = model.find(search, fields);

  if (sort && typeof sort === 'object') {
    query = query.sort(sort);
  }

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => { query = query.populate(p); });
    } else {
      query = query.populate(populate);
    }
  }

  return query.exec()
    .then(list => { return { list }; })
    .catch(err => { return { err: err.message }; });
};

/**
 * 获取符合条件的所有数据
 * @param {*} model 数据模型
 * @param {*} search 查询条件
 * @return {*} 记录数
 */
const _count = (model, search) => {
  return model.count(search).then(count => count).catch(err => err.message);
};
module.exports.count = _count;

/**
 * 分页获取符合条件的数据
 * @param {*} model 数据模型
 * @param {*} search 查询条件
 * @param {*} sort 排序
 * @param {*} ps 排序
 * @param {*} p 排序
 * @param {*} fields 返回字段
 * @param {*} populate 连接查询 {path,select,model,match,options} http://mongoosejs.com/docs/api.html#query_Query-populate
 * @return {*} 查询结果
 */
module.exports.list = async ({ model, ps, p, sort, fields, search, populate }) => {

  const check = baseCheck({ model });
  if (check) return Promise.reject(check);

  // console.log('db-list-2:', ps, p);
  // 查询条件处理
  if (search && typeof search === 'object') {
    Object.keys(search).forEach(key => {
      if (typeof search[key] === 'undefined') delete search[key];
    });
    if (!p && search.p) {
      p = search.p * 1;
      delete search.p;
    }
    if (!ps && search.ps) {
      ps = search.ps * 1;
      delete search.ps;
    }
  }
  ps *= 1;
  p *= 1;
  // console.log('db-list-3:', ps, typeof p);
  if (typeof ps !== 'number' || ps < 1) ps = 10;
  if (typeof p !== 'number' || p < 1) p = 1;

  const count = await _count(model, search);
  if (typeof count !== 'number') return { err: count };
  if (count === 0) return { count: 0, list: [] };

  const pageCount = Math.ceil(count / ps);
  // console.log('db-list-4:', pageCount, p);
  if (p > pageCount) {
    p = pageCount;
  }

  let query = model.find(search, fields)
    .skip((p - 1) * ps)
    .limit(ps);

  if (sort && typeof sort === 'object') {
    query = query.sort(sort);
  }

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(p => { query = query.populate(p); });
    } else {
      query = query.populate(populate);
    }
  }

  return query.exec()
    .then(list => { return { list, count }; })
    .catch(err => { return { err: err.message }; });
};

/**
 * 获取模型的结构
 * @param {*} model 模型
 * @return {*} 结构数组
 */
module.exports.getSchema = model => {
  const schema = model.schema;
  const d = [];
  Object.keys(schema.obj).forEach(key => {
    const t = schema.obj[key];
    let o = {};
    if (typeof t === 'object') {
      o = t;
    }
    d.push({
      name: key,
      title: o.__tit,
      desc: o.__desc,
      required: o.required, // 是否必须
      default: o.default, // 默认值
      validate: o.validate, // 验证函数
      match: o.match, // 正则验证
      unique: o.unique, // 是否唯一
      min: o.min, // 最小值
      max: o.max, // 最大值
      enum: o.enum, // 枚举限制
    });
  });
  return d;
};
