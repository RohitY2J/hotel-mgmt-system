const dbContext = require('../model');
const conversion = require('../helper/conversion');

exports.createTable = async (req, res, next) => {
    table = req.body;
    table.clientId = req.user.clientId;

    errors = [];
    if (!table.tableNumber) {
        errors.push("Table Number is required.");
    }

    const existingTable = await CheckIfTableExist(table.tableNumber);
    if (existingTable.length > 0) {
        errors.push("Table Number already exisits");
    }

    if (errors.length > 0) {
        const errorString = errors.join('\n');
        return res.status(422).json({
            success: false,
            msg: errorString
        });
    }

    try {
        const newTable = new dbContext.Table({
            tableNumber: table.tableNumber,
            location: table.location,
            status: table.status,
            capacity: table.capacity,
            clientId: table.clientId
        });

        await newTable.save();
        return res.status(200).json({
            success: true,
            msg: 'success'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }
}

exports.updateTable = async (req, res, next) => {
    table = req.body;

    errors = [];

    let existingTable = await dbContext.Table.findOne({_id: table.id});
    if (!existingTable) {
        errors.push("Table with given table number does not exist");
    }

    if (errors.length > 0) {
        const errorString = errors.join('\n');
        return res.status(422).json({
            success: false,
            msg: errorString
        });
    }

    try {
        existingTable.status = table.status;
        existingTable.location = table.location;
        existingTable.capacity =  table.capacity;

        await existingTable.save();
        return res.status(200).json({
            success: true,
            msg: 'success'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:" + err.message
        });
    }


}

exports.getTabels = async (req, res, next) => {
    filter = {};

    if(req.body.hasOwnProperty('status') && req.body.status != '') {
        filter.status = req.body.status;
    }

    // if(req.body.menuName){
    //     filter.name = { $regex: new RegExp(req.body.menuName, 'i') };
    // }

    // Extract pagination parameters
    const page = parseInt(req.body.pagination?.page) || 1;  // Default to page 1 if not provided
    const limit = parseInt(req.body.pagination?.count) || 8;  // Default to 10 items per page if not provided
    const skip = (page - 1) * limit;

    const tables = await dbContext.Table.find(filter)
        .skip(skip)
        .limit(limit);


    // menus.forEach(menu => {
    //     if (menu.file) {
    //         menu.file = "http://localhost:8000/uploads/" + menu.file;
    //     }
    // });
    return res.status(200).json({
        success: true,
        msg: 'tables successfully retrieved',
        data: tables
    });
}


async function CheckIfTableExist(tableNo) {
    return await dbContext.Table.find({ tableNumber: { $regex: new RegExp(tableNo, 'i') } });

}