process.env.NODE_ENV = 'test';
const {app,server,mongoose} = require('../index');
const jwt = require('jsonwebtoken');

describe('User APIs', () => {
  let mongoServer;
  let sinon;
  let dbContext;
  let request
  
  // Setup before all tests
  before(async () => {
    let chai = await import('chai');
    expect = chai.expect;

    request = (await import('supertest')).default;
    sinon = (await import('sinon')).default;

    const { MongoMemoryServer } = await import('mongodb-memory-server');

    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'hotel-mgmt-test' } // Optional: specify database name
    });
    
    const mongoUri = mongoServer.getUri();

    // Close any existing Mongoose connection
    if (mongoose.connection.readyState !== 0) {
        console.log("Already existing connection!!");
        await mongoose.connection.close();
    }
    else{
        console.log("No existing connection!!");    
    }

    // Connect Mongoose to in-memory database
    await mongoose.connect(mongoUri);

    dbContext = require('../model');
  });

  // Cleanup after all tests
  after(async () => {
    server.close(); // Close Express server
    if (mongoose.connection.readyState !== 0) { // Check if mongoose connection is open
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop(); // Stop in-memory MongoDB
    }
  });

  describe('User Creation', () => {
    let clientId;
    let agent;

    beforeEach(async () => {
      agent = request.agent(server);
      
      client = new dbContext.Client({name : "TestClient"});
      await client.save();

      clientId = client._id;

      user = new dbContext.User({
        email: 'test.user@example.com',
        userName: 'Test User',
        clientId: client._id,
        fullName: 'Test User',
        phNum: '1234567890',
        roleID: 1, // Admin
      });
      user.setPassword('TestPassword');
      await user.save();

      // Mock setPassword
      sinon.stub(dbContext.User.prototype, 'setPassword').callsFake(function (password) {
        this.salt = 'mockSalt';
        this.hash = 'mockHash';
      });

      // Mock checkIfUserExists
      //sinon.stub(global, 'checkIfUserExists').resolves(null);

      accessToken = jwt.sign(
        { id: user._id, 
          email: 'test.user@example.com',
          user: 'Test User',
          aud: 'Hotel Mgmt',
          role: user.roleID 
        },
        'temp-secret-key', // Temporary secret key
        { expiresIn: '1h' }
      );

      agent.set('Authorization', `Bearer ${accessToken}`);
    });

    afterEach(async () => {
      sinon.restore();
      await dbContext.User.deleteMany({});
      await dbContext.Client.deleteMany({});
    });

    it('should return 422 if userName is missing', async () => {
      const res = await agent
        .post('/api/login/create')
        .send({
          password: 'password',
          email: 'john.doe@example.com',
          clientId: clientId,
        })
        .expect(422);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('msg', 'user is required');
    });

    it('should return 422 if password is missing', async () => {
      const res = await agent
        .post('/api/login/create')
        .send({
          userName: 'JohnDoe',
          email: 'john.doe@example.com',
          clientId: clientId,
        })
        .expect(422);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('msg', 'password is required');
    });

    it('should return 422 if email is missing', async () => {
      const res = await agent
        .post('/api/login/create')
        .send({
          userName: 'JohnDoe',
          password: 'password',
          clientId: clientId,
        })
        .expect(422);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('msg', 'email is required');
    });

    it('should return 422 if clientId is missing', async () => {
      const res = await agent
        .post('/api/login/create')
        .send({
          userName: 'JohnDoe',
          password: 'password',
          email: 'john.doe@example.com',
        })
        .expect(422);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('msg', 'clientId is required');
    });

    it('should return 422 if user with email already exists', async () => {
      // Mock checkIfUserExists to return an existing user
      //sinon.stub(global, 'checkIfUserExists').resolves({ email: 'john.doe@example.com' });

      const res = await agent
        .post('/api/login/create')
        .send({
          userName: 'JohnDoe',
          password: 'password',
          email: 'test.user@example.com',
          clientId: clientId,
        })
        .expect(422);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('msg', 'User with that email already exists');
    });

    it('should create a user successfully', async () => {
      const res = await agent
        .post('/api/login/create')
        .send({
          userName: 'JohnDoe',
          password: 'password',
          email: 'john.doe@example.com',
          fullName: 'John Doe',
          phNum: '1234567890',
          clientId: clientId,
        })
        .expect(200);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('msg', 'success');

      // Verify user in database
      const savedUser = await dbContext.User.findOne({ email: 'john.doe@example.com' });
      expect(savedUser).to.exist;
      expect(savedUser).to.have.property('userName', 'JohnDoe');
      expect(savedUser).to.have.property('fullName', 'John Doe');
      expect(savedUser).to.have.property('phNum', '1234567890');
      //expect(savedUser).to.have.property('clientId').that.equals(clientId);
      expect(savedUser).to.have.property('hash', 'mockHash');
      expect(savedUser).to.have.property('salt', 'mockSalt');
      expect(savedUser).to.have.property('meta').that.has.property('isDeleted', false);
    });

    it('should return 422 on database error', async () => {
      // Mock save to throw an error
      sinon.stub(dbContext.User.prototype, 'save').rejects(new Error('Database error'));

      const res = await agent
        .post('/api/login/create')
        .send({
          userName: 'JohnDoe',
          password: 'password',
          email: 'john.doe@example.com',
          clientId: clientId,
        })
        .expect(422);

      console.log('Response body:', res.body);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('msg', 'Database error');
    });
  });
});