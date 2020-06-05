'use strict';

/**
 * @param {Egg.Application} app - egg application
 */

module.exports = app => {
  const jwt = app.middleware.jwt(app.config.jwt);
  const { router, controller } = app;
  router.get('/',jwt, controller.home.index);
  // router.get('/api/user/info', controller.user.getUserInfoById);
  router.post('/api/user/login', controller.user.login);
  router.post('/api/user/register', controller.user.register);
  router.post('/api/base/sendCode',jwt, controller.base.sendCode);
};
