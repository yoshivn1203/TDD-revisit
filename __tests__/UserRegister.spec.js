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
  const validUser = {
    username: 'user1',
    email: 'user1@mail.com',
    password: 'P4ssword',
  };

  const postUser = (user = validUser) => {
    return request(app).post('/api/1.0/users').send(user);
  };

  it('return 200 ok when signup request is valid', async () => {
    const response = await postUser();

    expect(response.status).toBe(200);
  });

  it('return message success when signup request is valid', async () => {
    const response = await postUser();

    expect(response.body.message).toBe('User created');
  });

  it('save the user to database', async () => {
    await postUser();

    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('save the username and email to database', async () => {
    await postUser();

    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
    expect(userList.length).toBe(1);
  });

  it('hashes te password in database', async () => {
    await postUser();

    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('return 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });

    expect(response.status).toBe(400);
  });

  it('return validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });

    const { body } = response;

    expect(body.validationErrors).not.toBeUndefined();
  });

  it('return errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });

    const { body } = response;

    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  // it('return Username cannot be null when username is null', async () => {
  //   const response = await postUser({
  //     username: null,
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   });

  //   const { body } = response;

  //   expect(body.validationErrors.username).toBe('Username cannot be null');
  // });

  // it('return Email cannot be null when email is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: null,
  //     password: 'P4ssword',
  //   });

  //   const { body } = response;

  //   expect(body.validationErrors.email).toBe('Email cannot be null');
  // });

  // it('return password cannot be null message when password is null', async () => {
  //   const response = await postUser({
  //     username: 'user1',
  //     email: 'user1@mail.com',
  //     password: null,
  //   });

  //   const { body } = response;

  //   expect(body.validationErrors.password).toBe('Password cannot be null');
  // });

  // it.each([
  //   ['username', 'Username cannot be null'],
  //   ['email', 'Email cannot be null'],
  //   ['password', 'Password cannot be null'],
  // ])('when %s is null %s is received', async (field, expectedMessage) => {
  //   const user = {
  //     username: 'user1',
  //     email: 'user1@mail.com',
  //     password: 'P4ssword',
  //   };

  //   user[field] = null;
  //   const response = await postUser(user);
  //   const { body } = response;
  //   expect(body.validationErrors[field]).toBe(expectedMessage);
  // });

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'Email cannot be null'}
    ${'email'}    | ${'mail.com'}      | ${'Email is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be at least 6 characters'}
    ${'password'} | ${'alllowercase'}  | ${'Password have at least 1 uppercase, 1 lower case and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password have at least 1 uppercase, 1 lower case and 1 number'}
    ${'password'} | ${'11112323'}      | ${'Password have at least 1 uppercase, 1 lower case and 1 number'}
    ${'password'} | ${'lowerAndUPPER'} | ${'Password have at least 1 uppercase, 1 lower case and 1 number'}
  `(
    'return $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      };

      user[field] = value;
      const response = await postUser(user);
      const { body } = response;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it('return Email in use when the same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    const { body } = response;
    expect(body.validationErrors.email).toBe('Email in use');
  });

  it('return errors for both username is null and email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const { body } = response;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});
