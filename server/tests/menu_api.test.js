process.env.NODE_ENV = 'test';
const { app, server, mongoose } = require('../index');

describe('Menu API Tests', () => {
  let mongoServer;
  let request;
  let chai;
  let expect;
  let sinon;

  // Setup before all tests
  before(async () => {
    chai = await import('chai');
    expect = chai.expect;
    request = (await import('supertest')).default;
    sinon = (await import('sinon')).default;

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create({
      instance: { dbName: 'hotel-mgmt-test' },
    });
    const mongoUri = mongoServer.getUri();

    if (mongoose.connection.readyState !== 0) {
      console.log('Already existing connection!!');
      await mongoose.connection.close();
    }
    await mongoose.connect(mongoUri);

    dbContext = require('../model');
  });

  // Cleanup after all tests
  after(async () => {
    server.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Menu Endpoints', () => {
    let clientId;
    let inventoryId;
    let agent;

    beforeEach(async () => {
      // Insert a mock Client
      let client = new dbContext.Client({ name: 'Test Client' });
      await client.save();

      clientId = client._id;

      // Insert a mock Inventory
      let inventory = new dbContext.Inventory(
            {   name: 'Test Inventory',
                itemType: 1,
                quantityUnitType: 2, 
                clientId });

      await inventory.save();

      inventoryId = inventory._id;

      // Setup agent for session persistence
      agent = request.agent(server);

      // Create a user for authentication
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

      // Login to set session
      const loginResponse = await agent.post('/api/login').send({
        email: 'test.user@example.com',
        password: 'TestPassword',
      });

      // Log cookies from response headers
      //console.log('Set-Cookie Header:', loginResponse.headers['set-cookie']);

      // Mock middleware
    //   sinon.stub(require('../index'), 'middleware').callsFake((req, res, next) => {
    //     console.log('Middleware stub called');
    //     req.user = { clientId: clientId.toString() };
    //     req.clientId = clientId;
    //     console.log('Middleware stub: req.clientId =', req.clientId);
    //     next();
    //   });

      // Mock FileUpload.single
      sinon.stub(require('../helper/file_upload').FileUpload, 'single').returns((req, res, next) => {
        req.file = { filename: 'menu-item.jpg' };
        next();
      });

      // Mock conversion.ToObjectId
      sinon.stub(require('../helper/conversion'), 'ToObjectId').callsFake((id) => {
        return new mongoose.Types.ObjectId(id);
      });

      // Mock CheckIfMenuExist
      //sinon.stub(require('../services/menuService'), 'CheckIfMenuExist').resolves([]);
    });

    afterEach(async () => {
      sinon.restore();
      await dbContext.MenuItem.deleteMany({});
      await dbContext.Client.deleteMany({});
      await dbContext.Inventory.deleteMany({});
    });

    describe('POST /api/menu/createMenuItem', () => {
      it('should return 422 if required fields are missing', async () => {
        const res = await agent
          .post('/api/menu/createMenuItem')
          .send({})
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Menu name is required.');
      });

      it('should return 422 if menu name already exists', async () => {
        await agent
          .post('/api/menu/createMenuItem')
          .send({
            name: 'Burger',
            description: 'Classic beef burger',
            price: 9.99,
            category: 'Main',
            available: true,
          })
          .expect(200);

        const res = await agent
          .post('/api/menu/createMenuItem')
          .send({
            name: 'Burger',
            description: 'Classic beef burger',
            price: 9.99,
            category: 'Main',
            available: true,
          })
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Menu name already exisits');
      });

      it('should create a menu item successfully', async () => {
        const res = await agent
          .post('/api/menu/createMenuItem')
          .send({
            name: 'Burger',
            description: 'Classic beef burger',
            price: 9.99,
            category: 'Main',
            available: true,
            inventoryId: inventoryId.toString(),
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'success');

        const savedMenuItem = await dbContext.MenuItem.findOne({ name: 'Burger' });
        expect(savedMenuItem).to.exist;
        expect(savedMenuItem).to.have.property('name', 'Burger');
        expect(savedMenuItem).to.have.property('description', 'Classic beef burger');
        expect(savedMenuItem).to.have.property('price', 9.99);
        expect(savedMenuItem).to.have.property('category', 'Main');
        expect(savedMenuItem).to.have.property('available', true);
        expect(savedMenuItem.inventoryId.toString()).to.equal(inventoryId.toString());
        //expect(savedMenuItem).to.have.property('file', 'menu-item.jpg');
      });

      it('should handle database errors', async () => {
        sinon.stub(dbContext.MenuItem.prototype, 'save').rejects(new Error('Database error'));

        const res = await agent
          .post('/api/menu/createMenuItem')
          .send({
            name: 'Burger',
            description: 'Classic beef burger',
            price: 9.99,
            category: 'Main',
            available: true,
          })
          .expect(500);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Error encountered:Database error');
      });
    });

    // describe('POST /api/menu/updateMenuItem', () => {
    //   let menuItemId;

    //   beforeEach(async () => {
    //     const menuItem = new dbContext.MenuItem({
    //       name: 'Pizza',
    //       description: 'Margherita pizza',
    //       price: 12.99,
    //       category: 'Main',
    //       available: true,
    //       clientId,
    //       file: 'pizza.jpg',
    //       meta: { isDeleted: false },
    //     });
    //     await menuItem.save();
    //     menuItemId = menuItem._id;
    //   });

    //   it('should return 422 if menu item does not exist', async () => {
    //     const res = await agent
    //       .post('/api/menu/updateMenuItem')
    //       .send({
    //         id: new mongoose.Types.ObjectId().toString(),
    //         description: 'Updated pizza',
    //         price: 14.99,
    //         category: 'Main',
    //         available: false,
    //       })
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Menu Item doesnot exist');
    //   });

    //   it('should update a menu item successfully', async () => {
    //     const res = await agent
    //       .post('/api/menu/updateMenuItem')
    //       .send({
    //         id: menuItemId.toString(),
    //         description: 'Updated Margherita pizza',
    //         price: 14.99,
    //         category: 'Main',
    //         available: false,
    //         inventoryId: inventoryId.toString(),
    //       })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'success');

    //     const updatedMenuItem = await dbContext.MenuItem.findById(menuItemId);
    //     expect(updatedMenuItem).to.have.property('description', 'Updated Margherita pizza');
    //     expect(updatedMenuItem).to.have.property('price', 14.99);
    //     expect(updatedMenuItem).to.have.property('category', 'Main');
    //     expect(updatedMenuItem).to.have.property('available', false);
    //     expect(updatedMenuItem.inventoryId.toString()).to.equal(inventoryId.toString());
    //     expect(updatedMenuItem).to.have.property('file', 'menu-item.jpg');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.MenuItem.prototype, 'save').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/menu/updateMenuItem')
    //       .send({
    //         id: menuItemId.toString(),
    //         description: 'Updated pizza',
    //         price: 14.99,
    //         category: 'Main',
    //         available: false,
    //       })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });

    // describe('POST /api/menu/getMenuItems', () => {
    //   beforeEach(async () => {
    //     await dbContext.MenuItem.create({
    //       name: 'Burger',
    //       description: 'Classic beef burger',
    //       price: 9.99,
    //       category: 'Main',
    //       available: true,
    //       clientId,
    //       inventoryId,
    //       meta: { isDeleted: false },
    //     });
    //   });

    //   it('should return 422 if clientId is missing', async () => {
    //     sinon.stub(require('../index'), 'middleware').restore();
    //     sinon.stub(require('../index'), 'middleware').callsFake((req, res, next) => {
    //       res.status(422).json({ success: false, msg: 'Client Id is required' });
    //     });

    //     const res = await agent
    //       .post('/api/menu/getMenuItems')
    //       .send({})
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Client Id is required');
    //   });

    //   it('should retrieve menu items successfully with pagination', async () => {
    //     const res = await agent
    //       .post('/api/menu/getMenuItems')
    //       .send({
    //         menuName: 'Burger',
    //         availableStatus: 'true',
    //         pagination: { page: 1, count: 10 },
    //       })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'menus successfully retrieved');
    //     expect(res.body.data).to.be.an('array');
    //     expect(res.body.data[0]).to.have.property('name', 'Burger');
    //     expect(res.body.data[0]).to.have.property('file').to.match(/^http:\/\/localhost\/Uploads\/menu-item\.jpg$/);
    //     expect(res.body.data[0].inventory).to.have.property('name', 'Test Inventory');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.MenuItem, 'aggregate').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/menu/getMenuItems')
    //       .send({})
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });

    // describe('POST /api/menu/getMenuNames', () => {
    //   beforeEach(async () => {
    //     await dbContext.MenuItem.create({
    //       name: 'Burger',
    //       description: 'Classic beef burger',
    //       price: 9.99,
    //       clientId,
    //       meta: { isDeleted: false },
    //     });
    //   });

    //   it('should return 422 if clientId is missing', async () => {
    //     sinon.stub(require('../index'), 'middleware').restore();
    //     sinon.stub(require('../index'), 'middleware').callsFake((req, res, next) => {
    //       res.status(422).json({ success: false, msg: 'Client Id is required' });
    //     });

    //     const res = await agent
    //       .post('/api/menu/getMenuNames')
    //       .send({})
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Client Id is required');
    //   });

    //   it('should retrieve menu names successfully', async () => {
    //     const res = await agent
    //       .post('/api/menu/getMenuNames')
    //       .send({ query: 'Burger' })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'menu name successfully retrieved');
    //     expect(res.body.data).to.include('Burger');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.MenuItem, 'find').rejects(new Error('Database error'));

    //     const res = await agent
    //       .post('/api/menu/getMenuNames')
    //       .send({ query: 'Burger' })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });
  });
});
