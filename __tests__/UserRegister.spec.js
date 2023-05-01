const request = require('supertest');
const app = require('../src/app');

const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

describe('User Registration', () => {
  const postValidUser = () => {
    return request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
  };

  it('return 200 ok when signup request is valid', async () => {
    const response = await postValidUser();

    expect(response.status).toBe(200);
  });

  it('return message success when signup request is valid', async () => {
    const response = await postValidUser();

    expect(response.body.message).toBe('User created');
  });

  it('save the user to database', async () => {
    await postValidUser();

    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('save the username and email to database', async () => {
    await postValidUser();

    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
    expect(userList.length).toBe(1);
  });

  it('hashes te password in database', async () => {
    await postValidUser();

    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });
});
