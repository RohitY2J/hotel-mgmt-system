const express = require('express')
const router = express.Router()

const dbContext = require('../../model');
const conversion = require('../../helper/conversion');
const { FileUpload } = require('../../helper/file_upload');

const businessLogic = require('../../business-logic');


router.post('/createEmployee', FileUpload.single('file'), async (req, res, next) => {
    let user = req.body;

    var errorMessage = [];
    if (!user.firstName) {
        errorMessage.push("FirstName is needed")
    }

    if (!user.lastName) {
        errorMessage.push("LastName is needed")
    }

    if (!user.email) {
        errorMessage.push("Email is needed")
    }

    if (!user.phoneNumber) {
        errorMessage.push("Phone Number is needed")
    }

    if(!user.role){
        errorMessage.push("Role is needed")
    }

    if (errorMessage.length > 0) {
        return res.status(422).json({
            success: false,
            msg: 'validation failed',
            error: errorMessage
        });
    }

    try {
        // Check if user with email already exists
        const existingUser = await checkIfEmployeeExists(user.email, user.firstName, user.lastName);
        if (existingUser) {
           return res.status(422).json({
                success: false,
                msg: 'User with that email and name already exists'
            });
        }

        // Create new user
        const newEmployee = new dbContext.Employee({
            firstName: user.firstName,
            lastName: user.lastName,
            contactInfo: {
                phone: user.phoneNumber,
                address: user.address,
                email: user.email
            },
            role: conversion.ToObjectId(user.role)
        });

        if(req.file){
            newEmployee.documents = [
                {
                    documentType: "ProfilePic",
                    fileObject: req.file.filename
                }
            ]
        }

        await newEmployee.save();
        console.log('employee created successfully:', newEmployee);
        return res.status(200).json({
            success: true,
            msg: 'success'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:"+err.message
        });
    }
})

router.post('/createEmployeeRole', async (req, res, next) => {
    let role = req.body;

    if (!role.roleName) {
        errorMessage.push("RoleName is needed")
    }

    try {
        const existingRole = await dbContext.Role.find({roleName: role.roleName});
        if (existingRole.length > 0) {
           return res.status(422).json({
                success: false,
                msg: 'Role already exists.'
            });
        }

        const newRole = new dbContext.Role({
            roleName: role.roleName
        });

        await newRole.save();
        console.log('employee created successfully:', newRole);
        return res.status(200).json({
            success: true,
            msg: 'success'
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            msg: "Error encountered:"+err.message
        });
    }
})


router.post('/getEmployees', async(req, res, next) => {
    try {
        let params = req.body;
        let filter = {};

        if(params.searchText){
            filter.$or = [
                { firstName: { $regex: new RegExp(params.searchText, 'i') } },
                { lastName: { $regex: new RegExp(params.searchText, 'i') } },
                { 'contactInfo.email': { $regex: new RegExp(params.searchText, 'i') }}
              ];
        }

        const employees = await dbContext.Employee.find(filter).populate('role');

        employees.forEach(employee => {
            let profilePics = employee.documents.find(x => x.documentType === "ProfilePic");
            if(profilePics ){
                let fileName = profilePics.fileObject;
                employee._doc.profilePicUrl = "http://localhost:8000/uploads/"+fileName;
            }
            else{
                employee._doc.profilePicUrl = null;
            }

            // Convert to plain object with virtuals
            employee = employee.toObject({ virtuals: true });
        });

        res.status(200).json({
            message: "Successfully retrieved all the employees",
            data: employees
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.get('/getRoles', async(req, res, next) => {
    try {
        const roles = await dbContext.Role.find();
        res.status(200).json({
            message: "Successfully retrieved all the employees",
            data: roles
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.post('/getEmployeeSchedule', async(req, res, next) => {
    try{
        filterParams = req.body;
        schedules = await businessLogic.EmployeeDailyActivityLogic.getEmployeeSchedules(filterParams);
        res.status(200).json({
            success: true,
            message: "Successfully retrieved schedules",
            data: schedules
        })
    }
    catch(err){
        res.status(500).json({ message: err.message, success: false });
    }
})

async function checkIfEmployeeExists(email, firstName, lastName) {
    const user = await dbContext.Employee.findOne({ 
        firstName: firstName, 
        lastName: lastName, 
        'contactInfo.email': email });
    return user; // Returns null if user not found, otherwise returns the user object
}

module.exports = router;
