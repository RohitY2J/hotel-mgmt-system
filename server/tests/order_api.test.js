process.env.NODE_ENV = 'test';
const { app, server, mongoose } = require('../index');
const sinon = require('sinon');

describe('Order API Tests', function () {
  let mongoServer;
  let request;
  //let chai;
  let expect;
  let dbContext;

  // Increase timeout for the suite
  this.timeout(10000);

  // Setup before all tests
  before(async () => {
    let chai = await import('chai');
    expect = chai.expect;
    request = (await import('supertest')).default;

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

  describe('Order Endpoints', () => {
    let clientId;
    let tableId;
    let inventoryId;
    let agent;

    beforeEach(async () => {
      console.log('Starting beforeEach');
      // Insert a mock Client
      let client = new dbContext.Client({ name: 'Test Client' });
      await client.save();
      clientId = client._id;

      // Insert a mock Table
      let table = new dbContext.Table({ 
        tableNumber: 'V1',
        status: 1,
        location: 'By the window',
        capacity: 4, 
        clientId });
      await table.save();
      
      tableId = table._id;

      // Insert a mock Inventory
      let inventory = new dbContext.Inventory({ 
        name: 'Test Inventory', 
        clientId, 
        itemType: 0,
        quantityUnitType: 0,
        availableUnit: 100 });
      await inventory.save();
      
      inventoryId = inventory._id;

      // Setup agent for session persistence
      agent = request.agent(server);

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

      // Stub conversion.ToObjectId
      sinon.stub(require('../helper/conversion'), 'ToObjectId').callsFake((id) => {
        return new mongoose.Types.ObjectId(id);
      });

      // Stub conversion.convertStringToInt
      sinon.stub(require('../helper/conversion'), 'convertStringToInt').callsFake((str) => parseInt(str));

      // Stub socket.io
    //   sinon.stub(require('../index'), 'app').value({
    //     get: sinon.stub().withArgs('socketio').returns({ emit: sinon.stub() })
    //   });

      console.log('beforeEach completed');
    });

    afterEach(async () => {
      sinon.restore();
      await dbContext.Order.deleteMany({});
      await dbContext.Client.deleteMany({});
      await dbContext.Table.deleteMany({});
      await dbContext.Bill.deleteMany({});
      await dbContext.Inventory.deleteMany({});
      await dbContext.InventoryReceiveAndDispatch.deleteMany({});
      await dbContext.User.deleteMany({});
    });

    describe('POST /api/order/addOrder', () => {
      it('should return 422 if tableNumber is missing', async () => {
        const res = await agent
          .post('/api/order/addOrder')
          .send({ orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }] })
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Table Number is required.');
      });

      it('should create a new order successfully', async () => {
        const res = await agent
          .post('/api/order/addOrder')
          .send({
              orders: [
                  { menuId: new mongoose.Types.ObjectId().toString(), 
                    qty: 2, 
                    price: 10, 
                    name: 'Burger', 
                    inventoryId: inventoryId.toString() 
                }
            ],
            tableNumber: tableId,
            test: ''
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'Order processed successfully!');

        const order = await dbContext.Order.findOne({ tableNumber: tableId });
        expect(order).to.exist;
        expect(order.orders).to.have.length(1);
        expect(order.orders[0]).to.have.property('name', 'Burger');
        expect(order.orders[0]).to.have.property('qty', 2);
        expect(order.orders[0]).to.have.property('price', 10);

        const table = await dbContext.Table.findOne({ _id: tableId });
        expect(table).to.have.property('status', 0);

        const dispatch = await dbContext.InventoryReceiveAndDispatch.findOne({ inventoryItemId: inventoryId });
        expect(dispatch).to.exist;
        expect(dispatch).to.have.property('count', 2);

        const inventory = await dbContext.Inventory.findOne({ _id: inventoryId });
        expect(inventory).to.have.property('availableUnit', 98);
      });

      it('should update an existing pending order', async () => {
        const existingOrder = new dbContext.Order({
          tableNumber: tableId,
          status: 0,
          clientId: clientId.toString(),
          orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 1, price: 10, name: 'Burger' }],
        });
        await existingOrder.save();

        let order = await dbContext.Order.findOne({ tableNumber: tableId.toString(), status: 0, clientId: clientId.toString()});

        const res = await agent
          .post('/api/order/addOrder')
          .send({
            tableNumber: tableId,
            orders: [
              { menuId: existingOrder.orders[0].menuId.toString(), qty: 2, price: 15, name: 'Burger' },
              { menuId: new mongoose.Types.ObjectId().toString(), qty: 3, price: 20, name: 'Pizza' }
            ]
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'Order processed successfully!');

        const updatedOrder = await dbContext.Order.findOne({ tableNumber: tableId });
        expect(updatedOrder.orders).to.have.length(2);
        expect(updatedOrder.orders[0]).to.have.property('qty', 3); // 1 + 2
        expect(updatedOrder.orders[0]).to.have.property('price', 15);
        expect(updatedOrder.orders[1]).to.have.property('name', 'Pizza');
      });
    });

    describe('POST /api/order/getSpecificOrder', () => {
      it('should retrieve specific order successfully', async () => {
        const order = new dbContext.Order({
          tableNumber: tableId,
          status: 0,
          clientId,
          orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }],
        });
        await order.save();

        const res = await agent
          .post('/api/order/getSpecificOrder')
          .send({ tableNumber: tableId.toString() })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'success');
        expect(res.body.data).to.have.property('tableNumber');
        expect(res.body.data.orders).to.have.length(1);
      });
    });

    describe('POST /api/order/getOrders', () => {

      it('should retrieve orders successfully with pagination', async () => {
        const order = new dbContext.Order({
          tableNumber: tableId,
          status: 0,
          clientId,
          orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }],
        });
        await order.save();

        const res = await agent
          .post('/api/order/getOrders')
          .send({
            pagination: { page: 1, pageSize: 8 },
            status: '0',
            tableNumber: tableId.toString(),
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'success');
        expect(res.body.data).to.be.an('array').with.length(1);
        expect(res.body.data[0]).to.have.property('total', 20);
        expect(res.body.data[0].table).to.have.property('status', 1);
      });

      it('should handle database errors', async () => {
        sinon.stub(dbContext.Order, 'aggregate').callsFake(() => ({
          exec: sinon.stub().callsFake(() => Promise.reject(new Error('Database error')))
        }));

        const res = await agent
          .post('/api/order/getOrders')
          .send({ pagination: { page: 1, pageSize: 8 } })
          .expect(500);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Error encountered:Database error');
      });
    });

    describe('POST /api/order/getOrderBills', () => {
      it('should retrieve order bills successfully', async () => {
        const order = new dbContext.Order({
          tableNumber: tableId,
          status: 0,
          clientId,
          orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }],
        });
        await order.save();

        const bill = new dbContext.Bill({
          orderId: order._id,
          clientId,
          discountType: 0,
          discountAmt: 5,
          taxPercent: 10,
          paymentType: 1,
          grandTotal: 25,
        });
        await bill.save();

        const res = await agent
          .post('/api/order/getOrderBills')
          .send({ id: order._id.toString() })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'success');
        expect(res.body.data).to.be.an('array').with.length(1);
        expect(res.body.data[0]).to.have.property('total', 20);
        expect(res.body.data[0].bill).to.have.property('grandTotal', 25);
      });

      it('should handle database errors', async () => {
        sinon.stub(dbContext.Order, 'aggregate').callsFake(() => ({
          exec: sinon.stub().callsFake(() => Promise.reject(new Error('Database error')))
        }));

        const res = await agent
          .post('/api/order/getOrderBills')
          .send({})
          .expect(500);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Error encountered:Database error');
      });
    });

    describe('POST /api/order/billOrder', () => {
      it('should return 422 if orderId is missing', async () => {
        const res = await agent
          .post('/api/order/billOrder')
          .send({ tableNumber: tableId.toString(), customerName: 'John Doe' })
          .expect(422);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Order Id is required');
      });

      it('should bill an order successfully', async () => {
        const order = new dbContext.Order({
          tableNumber: tableId,
          status: 0,
          clientId,
          orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }],
        });
        await order.save();

        const res = await agent
          .post('/api/order/billOrder')
          .send({
            _id: order._id.toString(),
            status: 2,
            tableNumber: tableId.toString(),
            customerName: 'John Doe',
            discountType: 0,
            discountAmt: 5,
            taxPercent: 10,
            paymentType: 0,
            totalPayable: 25,
          })
          .expect(200);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('msg', 'Status updated');

        const updatedOrder = await dbContext.Order.findOne({ _id: order._id });
        expect(updatedOrder).to.have.property('customerName', 'John Doe');

        const bill = await dbContext.Bill.findOne({ orderId: order._id });
        expect(bill).to.have.property('grandTotal', 25);

        const table = await dbContext.Table.findOne({ _id: tableId });
        expect(table).to.have.property('status', 1);
      });

      it('should handle database errors', async () => {
        sinon.stub(dbContext.Order, 'findOne').callsFake(() => ({
          save: sinon.stub().returns({
            then: (resolve, reject) => reject(new Error('Database error')),
            catch: sinon.stub().callsFake((cb) => cb(new Error('Database error')))
          })
        }));

        const res = await agent
          .post('/api/order/billOrder')
          .send({ _id: new mongoose.Types.ObjectId().toString(), tableNumber: tableId.toString() })
          .expect(500);

        console.log('Response body:', res.body);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('msg', 'Error encountered:Database error');
      });
    });

    // describe('POST /api/order/updateStatus', () => {
    //   it('should return 422 if orderId or status is missing', async () => {
    //     const res = await agent
    //       .post('/api/order/updateStatus')
    //       .send({})
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Order Id and status is required');
    //   });

    //   it('should update order status successfully', async () => {
    //     const order = new Order({
    //       tableNumber: tableId,
    //       status: 0,
    //       clientId,
    //       orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }],
    //     });
    //     await order.save();

    //     const res = await agent
    //       .post('/api/order/updateStatus')
    //       .send({ orderId: order._id.toString(), status: 1 })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'Status updated');

    //     const updatedOrder = await Order.findOne({ _id: order._id });
    //     expect(updatedOrder).to.have.property('status', 1);
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Order, 'findOne').callsFake(() => ({
    //       select: sinon.stub().returns({
    //         then: (resolve, reject) => reject(new Error('Database error')),
    //         catch: sinon.stub().callsFake((cb) => cb(new Error('Database error')))
    //       })
    //     }));

    //     const res = await agent
    //       .post('/api/order/updateStatus')
    //       .send({ orderId: new mongoose.Types.ObjectId().toString(), status: 1 })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });

    // describe('POST /api/order/getCustomerName', () => {
    //   it('should return 422 if clientId is missing', async () => {
    //     sinon.stub(require('../helper/client_check_middleware'), 'call').restore();
    //     sinon.stub(require('../helper/client_check_middleware'), 'call').callsFake((req, res, next) => {
    //       res.status(422).json({ success: false, msg: 'Client Id is required' });
    //     });

    //     const res = await agent
    //       .post('/api/order/getCustomerName')
    //       .send({})
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Client Id is required');
    //   });

    //   it('should retrieve customer names successfully', async () => {
    //     const order = new Order({
    //       tableNumber: tableId,
    //       status: 0,
    //       clientId,
    //       customerName: 'John Doe',
    //       orders: [{ menuId: new mongoose.Types.ObjectId(), qty: 2, price: 10, name: 'Burger' }],
    //     });
    //     await order.save();

    //     const res = await agent
    //       .post('/api/order/getCustomerName')
    //       .send({ filterValue: 'John' })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'customers retrived successfully');
    //     expect(res.body.data).to.include('John Doe');
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Order, 'distinct').callsFake(() => ({
    //       then: (resolve, reject) => {
    //         console.log('dbContext.Order.distinct stub called');
    //         reject(new Error('Database error'));
    //       },
    //       catch: sinon.stub().callsFake((cb) => cb(new Error('Database error')))
    //     }));

    //     const res = await agent
    //       .post('/api/order/getCustomerName')
    //       .send({ filterValue: 'John' })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });

    // describe('POST /api/order/cancelOrderMenu', () => {
    //   it('should return 422 if clientId is missing', async () => {
    //     sinon.stub(require('../helper/client_check_middleware'), 'call').restore();
    //     sinon.stub(require('../helper/client_check_middleware'), 'call').callsFake((req, res, next) => {
    //       res.status(422).json({ success: false, msg: 'Client Id is required' });
    //     });

    //     const res = await agent
    //       .post('/api/order/cancelOrderMenu')
    //       .send({ tableNumber: tableId.toString(), menuId: new mongoose.Types.ObjectId().toString() })
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Client Id is required');
    //   });

    //   it('should return 422 if tableNumber or menuId is missing', async () => {
    //     const res = await agent
    //       .post('/api/order/cancelOrderMenu')
    //       .send({})
    //       .expect(422);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Menu Id and TableNumber is required');
    //   });

    //   it('should cancel order menu successfully', async () => {
    //     const menuId = new mongoose.Types.ObjectId();
    //     const order = new Order({
    //       tableNumber: tableId,
    //       status: 0,
    //       clientId,
    //       orders: [{ menuId, qty: 2, price: 10, name: 'Burger' }],
    //     });
    //     await order.save();

    //     const res = await agent
    //       .post('/api/order/cancelOrderMenu')
    //       .send({ tableNumber: tableId.toString(), menuId: menuId.toString() })
    //       .expect(200);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', true);
    //     expect(res.body).to.have.property('msg', 'order menu cancelled successfully');

    //     const updatedOrder = await Order.findOne({ tableNumber: tableId });
    //     expect(updatedOrder.orders).to.have.length(0);
    //   });

    //   it('should handle database errors', async () => {
    //     sinon.stub(dbContext.Order, 'findOne').callsFake(() => ({
    //       select: sinon.stub().returns({
    //         then: (resolve, reject) => reject(new Error('Database error')),
    //         catch: sinon.stub().callsFake((cb) => cb(new Error('Database error')))
    //       })
    //     }));

    //     const res = await agent
    //       .post('/api/order/cancelOrderMenu')
    //       .send({ tableNumber: tableId.toString(), menuId: new mongoose.Types.ObjectId().toString() })
    //       .expect(500);

    //     console.log('Response body:', res.body);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('msg', 'Error encountered: Database error');
    //   });
    // });
  });
});
