const bcrypt = require('bcrypt');
const User = require('./User');

const save = async (body) => {
  const hash = await bcrypt.hash(body.password, 10);

  // METHOD 1
  // const user = Object.assign(req.body, { password: hash });

  // METHOD 2
  const user = { ...body, password: hash };

  // METHOD 3
  // const user = {
  //   username: req.body.username,
  //   email: req.body.email,
  //   password: hash,
  // };

  await User.create(user);
};

module.exports = { save };
