const dbContext = require('../model');
const conversion = require('../helper/conversion');
const env = require('../../env/nodeEnv');

exports.createMenuItem = async (req, res, next) => {
    if (!req.clientId) {
        return res.status(422).json({
            success: false,
            msg: 'Client Id is required'
        });
    }

    menu = req.body;

    errors = [];
    if (!menu.name) {
        errors.push("Menu name is required.");
    }

    const existingMenu = await CheckIfMenuExist(menu.name, req.clientId);
    if (existingMenu.length > 0) {
        errors.push("Menu name already exisits");
    }

    if (errors.length > 0) {
        const errorString = errors.join('\n');
        return res.status(422).json({
            success: false,
            msg: errorString
        });
    }

    try {
        const newMenu = new dbContext.MenuItem({
            name: menu.name,
            description: menu.description,
            price: menu.price,
            category: menu.category,
            available: menu.available,
            clientId: conversion.ToObjectId(req.clientId)
        });

        if (menu.inventoryId) {
            newMenu.inventoryId = conversion.ToObjectId(menu.inventoryId);
        }

        if (req.file) {
            newMenu.file = req.file.filename;
        }

        await newMenu.save();
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

exports.updateMenuItem = async (req, res, next) => {
    menu = req.body;

    errors = [];

    let existingMenu = await dbContext.MenuItem.findOne({ _id: menu.id });
    if (!existingMenu) {
        errors.push("Menu Item doesnot exist");
    }

    if (errors.length > 0) {
        const errorString = errors.join('\n');
        return res.status(422).json({
            success: false,
            msg: errorString
        });
    }

    try {
        existingMenu.description = menu.description;
        existingMenu.price = menu.price;
        existingMenu.category = menu.category;
        existingMenu.available = menu.available;

        if (menu.inventoryId) {
            existingMenu.inventoryId = conversion.ToObjectId(menu.inventoryId);
        }

        if (req.file) {
            existingMenu.file = req.file.filename;
        }

        await existingMenu.save();
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

exports.getMenuNames = async (req, res, next) => {
    try {
        if (!req.clientId) {
            return res.status(422).json({
                success: false,
                msg: 'Client Id is required'
            });
        }

        const filterValue = req.body.query;
        const menus = await dbContext.MenuItem.find({ name: { $regex: filterValue, $options: 'i' }, clientId: req.clientId }).select('name');
        return res.status(200).json({
            success: true,
            msg: 'menu name successfully retrieved',
            data: menus.map(menu => menu.name)
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            msg: 'Error encountered: ' + err.message
        });
    }
}

exports.getMenuItems = async (req, res, next) => {
    if (!req.clientId) {
        return res.status(422).json({
            success: false,
            msg: 'Client Id is required'
        });
    }

    filter = { clientId: conversion.ToObjectId(req.clientId) };
    afterFilter = {};

    if (req.body.availableStatus) {
        filter.available = req.body.availableStatus.toLowerCase() === 'true';
    }

    if (req.body.menuName) {
        filter.name = { $regex: new RegExp(req.body.menuName, 'i') };
    }

    // Extract pagination parameters
    const page = parseInt(req.body.pagination?.page) || 1;  // Default to page 1 if not provided
    const limit = parseInt(req.body.pagination?.count) || 8;  // Default to 10 items per page if not provided
    const skip = (page - 1) * limit;

    const pipeline = [
        { $match: filter },
        {
            $lookup: {
                from: 'inventories', // The collection name of the referenced model
                localField: 'inventoryId',
                foreignField: '_id',
                as: 'inventory'
            }
        },
        {
            $unwind: {
                path: '$inventory',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                inventory: {
                    $ifNull: ['$inventory', null]
                }
            }
        },
        //{ $match: afterFilter },
        { $skip: skip },
        { $limit: limit },
    ];
    const menus = await dbContext.MenuItem.aggregate(pipeline).exec();


    menus.forEach(menu => {
        if (menu.file) {
            menu.file = env.serverUrl + "/uploads/" + menu.file;
        }
    });
    return res.status(200).json({
        success: true,
        msg: 'menus successfully retrieved',
        data: menus
    });
}


async function CheckIfMenuExist(menuName, clientId) {
    return await dbContext.MenuItem.find({ name: { $regex: new RegExp(menuName, 'i') }, clientId: conversion.ToObjectId(clientId) });

}