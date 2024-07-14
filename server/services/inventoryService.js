const dbContext = require("../model");
const globalConstants = require("../constants/globalConstants");

exports.createInventoryItem = async (req, res, next) => {
  var user = req.user;
  try {
    const item = dbContext.Inventory(req.body);
    item.createdDate = Date.now();
    await item.save();
    let successRes = 'Item saved successfully.';
    console.info(successRes);
    return res.status(200).send(successRes);
    re
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
exports.addItem = (req, res, next) => {
//TODO
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

