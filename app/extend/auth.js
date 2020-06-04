'use strict';
const enums = require('./enum');

module.exports = (ctx, loginType = enums.LoginType.Manage) => {
  // console.log('auth', ctx.session);
  const login = ctx.session[`${loginType}login`];
  // console.log('auth-login', login);
  return {
    isLogin() {
      return !!login && !!login._id;
    },
    setLogin(loginData) {
      ctx.session[`${loginType}login`] = loginData;
    },
    getLogin() {
      return login;
    },
    logout() {
      ctx.session[`${loginType}login`] = null;
    },
    hasPower(path) {
      if (!login.role || !login.role.powers || !login.role.powers.length) return false;
      return !!login.role.powers[path];
    },
    /**
     * 权限范围
     * @param {*} path 
     * @param {*} param1 
     */
    hasPowerMore(path, { shopID }) {
      if(!this.hasPower(path)){
        return false;
      }
      const p = login.role.powers[path];
      if(!p || typeof p === 'boolean') return true;

      if(p.shops && p.shops.length){
        return p.shops.findIndex(shopID) !== -1;
      }
    },
    getPower(path) {
      if (!login.role || !login.role.powers || !login.role.powers.length) return null;
      return login.role.powers[path];
    },
  };
};
