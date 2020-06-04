'use strict';

module.exports = app => {
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;

  const userSchema = new Schema({
    name: {
      type: String, unique: true, required: [true, '账号不能为空'], trim: true, __tit: '账号',
    },
    realName: { type: String, __tit: '姓名' },
    phone: {
      type: String, unique: true, required: [true, '手机不能为空'], trim: true, __tit: '手机',
    },
    shopID: { type: Schema.ObjectId, ref: 'dataShop', __tit: '门店' },
    pwd: { type: String, required: [true, '密码不能为空'], __tit: '密码', __desc: 'md5加密' },
    role: { type: Schema.ObjectId, ref: 'role', __tit: '角色' },
    limit: { },// 权限范围： 覆盖角色里的权限范围
    level: { type: Number, __tit: '用户级别', __desc: '数字越小级别越高' }, // 低级用户无法修改删除高级用户
    gender: { type: String, enum: ['男', '女'], __tit: '性别' },
    email: { type: String, __tit: '邮箱' },
    qq: { type: String, __tit: 'QQ' },
    remarks: { type: String, __tit: '备注' },

    state: { type: Boolean, enum: [true, false], default: true, __tit: '状态', __desc: '启用或禁用' },
    createBy: { type: Schema.ObjectId, __tit: '创建人' },
    createTime: { type: Date, __tit: '创建时间' },
    updateBy: { type: Schema.ObjectId, ref: 'user', __tit: '更新人' },
    updateTime: { type: Date, __tit: '更新时间' },
  });

  return mongoose.model('user', userSchema,'user');
};
