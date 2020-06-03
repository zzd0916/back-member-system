'use strict';

/**
 * @param {Egg.Application} app - egg application
 */

module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/api/user/info', controller.user.getUserInfoById);
  router.post('/api/user/login', controller.user.login);
  router.post('/api/user/register', controller.user.createUser);
};
