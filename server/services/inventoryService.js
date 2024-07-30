const dbContext = require("../model");
const globalConstants = require("../constants/globalConstants");
const mongoose = require('mongoose');
const conversion = require("../helper/conversion");


exports.createInventoryItem = async (req, res, next) => {
  var user = req.user;

  if (!req.clientId) {
    return res.status(422).json({
      success: false,
      msg: 'Client Id is required'
    });
  }
  try {
    let inventoryItemId = new mongoose.Types.ObjectId();
    const item = dbContext.Inventory(req.body);
    item._id = inventoryItemId;
    item.createdDate = Date.now();
    item.clientId = conversion.ToObjectId(req.clientId);
    await item.save();

    if (item.itemType == 0) {
      let menuItem = dbContext.MenuItem({
        name: item.name,
        description: item.description,
        price: item.pricePerUnit,
        category: item.category,
        availableQuantity: item.availableUnit,
        inventoryId: inventoryItemId,
        clientId: req.clientId
      });
      if(req.file && req.file.filename){
        menuItem.file = req.file.filename;
      }
      await menuItem.save();
      console.info("Menu item added from inventory item");
    }

    let successRes = "Item saved successfully.";
    return res.status(200).send({ message: successRes });

  } catch (err) {
    if (err.name === "ValidationError") {
      let errResponse = { message: "Invalid input.", error: err };
      console.error(`Invalid input: `, errResponse);
      return res.status(400).send(errResponse);
    } else {
      let errResponse = { message: "Invalid input.", error: err };
      console.error(`Error occurred while saving charges `, errResponse);
      return res.status(500).send(errResponse);
    }
  }
};
exports.addItem = async (req, res, next) => {
  try {
    if (req.body.numberOfItems <= 0)
      return res.status(400).send("Number of items should be greater than 0");

    let inventoryAddRequest = {
      inventoryItemId: req.body.id,
      itemName: req.body.itemName,
      actionType: globalConstants.InventoryActionType.Receive,
      count: req.body.numberOfItems,
      clientId: req.clientId
    };

    await dbContext.InventoryReceiveAndDispatch(inventoryAddRequest).save();

    let inventoryUpdateRequest = {
      $inc: { availableUnit: req.body.numberOfItems },
      lastAddedOn: Date.now(),
      lastAddedUnit: req.body.numberOfItems,
    };

   

    let result = await dbContext.Inventory.updateOne(
      { _id: req.body.id },
      inventoryUpdateRequest
    );

    let menuItemUpdateRequest = {
      $inc: {available: req.body.numberOfItems}
    };
    
    await dbContext.MenuItem.updateOne(
      {inventoryId: req.body.id},
      menuItemUpdateRequest
    )

    if (result.modifiedCount === 0) {
      let errRes = { message: "Unable to add items.", error: null };
      return res.status(400).send(errRes);
    }
    return res
      .status(200)
      .send({ success: true, message: "Items added successfully" });
  } catch (err) {
    let errRes = { message: "Error adding item.", error: err };
    console.error(errRes);
    return res.status(500).send(errRes);
  }
};
exports.dispatchItem = async (req, res, next) => {
  try {
    if (req.body.numberOfItems <= 0)
      return res.status(400).send("Number of items should be greater than 0");

    let inventoryAddRequest = {
      inventoryItemId: req.body.id,
      itemName: req.body.itemName,
      actionType: globalConstants.InventoryActionType.Dispatch,
      count: req.body.numberOfItems,
      clientId: req.clientId
    };

    await dbContext.InventoryReceiveAndDispatch(inventoryAddRequest).save();

    let inventoryUpdateRequest = {
      $inc: { availableUnit: (0 - req.body.numberOfItems) }, //decrement item
      lastAddedOn: Date.now(),
      lastAddedUnit: req.body.numberOfItems,
    };

    let menuItemUpdateRequest = {
      $inc: {available: (0 - req.body.numberOfItems)}
    };
    
    await dbContext.MenuItem.updateOne(
      {inventoryId: req.body.id},
      menuItemUpdateRequest
    )

    let result = await dbContext.Inventory.updateOne(
      { _id: req.body.id },
      inventoryUpdateRequest
    );

    if (result.modifiedCount === 0) {
      let errRes = { message: "Unable to dispatch items.", error: null };
      return res.status(400).send(errRes);
    }
    return res
      .status(200)
      .send({ success: true, message: "Items dispatched successfully" });
  } catch (err) {
    let errRes = { message: "Error dispatching item.", error: err };
    console.error(errRes);
    return res.status(500).send(errRes);
  }
};

exports.getItemById = async (req, res, next) => {
  try {
    let result = await dbContext.Inventory.findById(req.query.id).select(`_id name description itemType quantityUnitType
       pricePerUnit availableUnit isVisibleInMenu 
       lastAddedOn lastAddedUnit minUnitToShowAlert file `);
    return res.status(200).send(result);
  } catch (err) {
    let errorRes = {
      message: "Error occurred while getting item.",
      error: err,
    };
    console.error(errorRes);
    return res.status(500).send(errorRes);
  }
};

exports.getItems = async (req, res, next) => {
  try{
    if (!req.clientId) {
      return res.status(422).json({
        success: false,
        msg: 'Client Id is required'
      });
    }
    req.body.clientId = conversion.ToObjectId(req.clientId);
    if(req.body.stockType){
      if(req.body.stockType == globalConstants.StockType.LowInStock){
        req.body.availableUnit = { "$lt": 100 };
      }
      else if(req.body.stockType == globalConstants.StockType.OutOfStock){
        req.body.availableUnit = 0;
      }
      delete req.body.stockType;
    }
    let results = await dbContext.Inventory.find(req.body)
    .select('_id name description itemType quantityUnitType pricePerUnit availableUnit minUnitToShowAlert')
    .skip((req.query.pageNo - 1) * req.query.pageSize)
    .limit(req.query.pageSize);
    return res.status(200).send(results);
  }catch(err){
    let errorRes = {
      message: "Error occurred while getting item.",
      error: err,
    };
    console.error(errorRes);
    return res.status(500).send(errorRes);
  }
};

exports.updateItems = async (req, res, next) => {
  try {
    let result = await dbContext.Inventory.updateOne(
      { _id: req.body._id },
      req.body
    );
    if (result.modifiedCount === 0) {
      let errRes = { message: "No record found for update.", error: null };
      return res.status(400).send(errRes);
    }
    return res
      .status(200)
      .send({ success: true, message: "Updated successfully." });
  } catch (err) {
    let errRes = { message: "Error updating item.", error: err };
    console.error(errRes);
    return res.status(500).send(errRes);
  }
};

exports.deleteItems = async (req, res, next) => {
  try {
    let result = await dbContext.Inventory.updateOne(
      { _id: req.query._id },
      { isDeleted: true }
    );
    if (result.modifiedCount === 0) {
      let errRes = { message: "No record found for delete.", error: null };
      return res.status(400).send(errRes);
    }
    return res
      .status(200)
      .send({ success: true, message: "Deleted successfully." });
  } catch (err) {
    let errRes = { message: "Error deleting item.", error: err };
    console.error(errRes);
    return res.status(500).send(errRes);
  }

 
};

exports.getAddDispatchHistory = async (req, res, next) =>{
  try{
    if (!req.clientId) {
      return res.status(422).json({
        success: false,
        msg: 'Client Id is required'
      });
    }
    req.body.clientId = conversion.ToObjectId(req.clientId);
    let results = await dbContext.InventoryReceiveAndDispatch.find(req.body)
    .select('_id inventoryItemId itemName actionType count createdAt')
    .skip((req.query.pageNo - 1) * req.query.pageSize)
    .limit(req.query.pageSize);
    return res.status(200).send(results);
  }catch(err){
    let errorRes = {
      message: "Error occurred while getting item.",
      error: err,
    };
    console.error(errorRes);
    return res.status(500).send(errorRes);
  }
};

