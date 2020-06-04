'use strict';

const crypto = require('crypto');
const fs = require('fs-extra');

const isNull = v => {
  if (typeof v === 'undefined') return true;
  if ((v + '').length === 0) return true;
  if ((v + '').replace(',', '').length === 0) return true;
  return false;
};
const getDate = v => {
  return new Date(v);
};

const getConditionValue = (cv, v) => {
  switch (cv) {
    case 0: // 模糊匹配
      return { $regex: v, $options: 'i' };
    case 1: // 精确匹配
      return v;
    case 'ne': // 不等于
      return { $ne: v };
    case 'gt': // 大于
      return { $gt: v };
    case 'lt': // 小于
      return { $lt: v };
    case 'gte': // 大于等于
      return { $gte: v };
    case 'lte': // 小于等于
      return { $lte: v };
    case 'd': // 查询某天
      return (v => {
        const date = getDate(v);
        return {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lte: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
        };
      })(v);
    case 'd-range': // 查询日期范围
      return (v => {
        v = v.split(','); // 两个日期用逗号隔开
        const r = {};
        if (!v.length) return r;
        if (v[0] && v[0].length) r.$gte = new Date(v[0]);
        if (v.length > 1 && v[1] && v[1].length) r.$lte = new Date(v[1]);
        return r;
      })(v);
    default:
      return v;
  }
};

module.exports = {
  /**
   * 获取文件名和后缀
   * @param {*} filename 文件名
   * @return {*} 文件后缀
   */
  getFileExt(filename) {
    let ext = '';
    if (filename.lastIndexOf('.') !== -1) {
      const dotIdx = filename.lastIndexOf('.');
      ext = filename.substring(dotIdx);
      filename = filename.substring(0, dotIdx);
    }
    return { filename, ext };
  },
  /**
   * MD5 加密密码
   * @param {*} str 字符串
   * @return {*} md5 密码
   */
  md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  },
  /**
   * 输出日志信息
   */
  log() {
    console.log('输出信息:', ...arguments);
  },
  /**
   * 输出错误信息
   */
  err() {
    console.error('错误信息:', ...arguments);
  },
  /**
   * 返回一个指定长度的新字符串，如果长度不够则用指定字符填充
   * @param {*} str 字符串
   * @param {*} pad 填充字符
   * @param {*} num 长度
   * @return {*} md5 新的字符串
   */
  padLeft(str, pad, num) {
    num = num - (str + '').length;
    if (num <= 0) return str;
    while (num > 0) {
      str = pad + str;
      num--;
    }
    return str;
  },
  getConditionValue,
  /**
   * 将http查询对象转换为mongo数据查询对象
   * @param {*} query http query
   * @param {*} opt 允许的查询条件 如果是数组[条件,字段]
   * @return {*} 查询对象
   */
  getSearch(query, opt) {
    const c = {};

    if (!query || !opt) return c;

    Object.keys(opt).forEach(key => {
      let _type = opt[key];
      let v = query[key];
      if (typeof opt[key] !== 'number') {
        _type = opt[key][0];
        v = query[opt[key][1]];
      }

      if (!isNull(v)) {
        c[key] = getConditionValue(_type, v);
      }
    });

    console.log("search transform", c)
    return c;
  },
  fsTool: {
    fs,
    /**
     * 获取路径，如果路径不存在，则会自动创建
     * @param {*} path 路径
     * @return {*} 创建后的路径
     */
    getPath(path) {
      let _path = '';
      path.split('/').forEach(s => {
        _path += s + '/';
        if (!(s === '' || s === '.' || s === '..')) {
          if (!fs.existsSync(_path)) {
            fs.mkdirSync(_path); // 文件夹不存在则创建
          }
        }
      });
      return path;
    },
    /**
     * 创建路径(如果存在则不创建)
     * @param {*} path 路径
     */
    createPath(path) {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path); // 文件夹不存在则创建
      }
    },
    /**
     * 删除文件或文件夹
     * @param {*} path 路径
     */
    del(path) {
      if (!fs.existsSync(path)) return;
      fs.removeSync(path);
      // if (path.substr(-1) == '/') {
      //     fs.rmdirSync(path);
      // } else {
      //     fs.unlinkSync(path);
      // }
    },
    rename(oldPath, newPath) {
      // console.log('|--移动文件', oldPath, newPath);
      return fs.renameSync(oldPath, newPath);
    },
    exists(path) {
      return fs.existsSync(path);
    },
    readJsonFile(path) {
      return fs.readJsonSync(path);
    },
    writeJsonFile(path, data) {
      return fs.writeJsonSync(path, data);
    },
    readFile(path, coding) {
      return fs.readFileSync(path, coding);
    },
    writeFile(path, data) {
      return fs.writeFileSync(path, data);
    },
  },
  date: {
    toFloat(time) {
      return time.getHours() + time.getMinutes() / 60 + time.getSeconds() / 3600;
    },
    /**
     * 返回用户的年龄（月份数）
     * @param {*} birth 生日
     */
    getBirthMonths(birth, date) {
      birth = typeof birth === 'string' ? new Date(birth) : birth;
      if(!birth) return 0;
      const now = date ? date : new Date();
      return (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth() + 1;
    },
    toTime(num) {
      num *= 3600;
      const hours = Math.floor(num / 3600);
      const minutes = Math.floor(num % 3600 / 60);
      const seconds = Math.floor(num % 3600 % 60);
      return `${hours > 9 ? hours : '0' + hours}:${minutes > 9 ? minutes : '0' + minutes}${seconds > 0 ? ':' + (seconds > 9 ? seconds : '0' + seconds) : ''}`;
    },
    toString(t, d) {
      if(d)
      return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
      return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()} ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;
    },
  },
};
