'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }
  mongoose: {
    enable: true,
    package: 'egg-mongoose',
  },
  session: {
    key: 'EGG_SESS',
    maxAge: 24 * 3600 * 1000, // 1 day
    httpOnly: true,
    encrypt: true
  },
  jwt: {
    enable: true,
    package: "egg-jwt"
  },
};
