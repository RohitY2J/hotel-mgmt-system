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

    if(!req.clientId){
        errorMessage.push("Client id is needed")
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
        const existingUser = await checkIfEmployeeExists(user.email, user.firstName, user.lastName, req.clientId);
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
            role: conversion.ToObjectId(user.role),
            clientId: conversion.ToObjectId(req.clientId)
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

router.post('/updateEmployee', FileUpload.single('file'), async (req, res, next) => {
    let user = req.body;

    var errorMessage = [];
    if(!user.employeeId){
        errorMessage.push("Employee id is missing");
    }

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

    if(!req.clientId){
        errorMessage.push("Client id is needed")
    }


    if (errorMessage.length > 0) {
        return res.status(422).json({
            success: false,
            msg: 'validation failed',
            error: errorMessage
        });
    }

    try {
        
        let existingEmployee = await dbContext.Employee.findOne({_id: user.employeeId}).exec();
        // Create new user

        existingEmployee.firstName = user.firstName;
        existingEmployee.lastName = user.lastName;
        existingEmployee.contactInfo = {
            phone: user.phoneNumber,
            address: user.address,
            email: user.email
        }
        existingEmployee.role = conversion.ToObjectId(user.role)

        if(req.file){
            existingEmployee.documents = [
                {
                    documentType: "ProfilePic",
                    fileObject: req.file.filename
                }
            ]
        }

        await existingEmployee.save();
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

router.post('/deleteEmployee', async(req, res, next) => {
    try{

        let employee = await dbContext.Employee.findOne({_id: req.body._id});
        employee.meta.isDeleted = true;
        
        await employee.save();
        return res.status(200).json({
            success: true,
            message: "Delete successfully"
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
})

router.post('/createEmployeeRole', async (req, res, next) => {
    let role = req.body;

    var errorMessage = [];
    if (!role.roleName) {
        errorMessage.push("RoleName is needed")
    }

    if(!req.clientId){
        errorMessage.push("Client id is needed")
    }

    if (errorMessage.length > 0) {
        return res.status(422).json({
            success: false,
            msg: 'validation failed',
            error: errorMessage
        });
    }

    
    try {
        const existingRole = await dbContext.Role.find({
            roleName: role.roleName, 
            clientId: conversion.ToObjectId(req.clientId)
        });
        if (existingRole.length > 0) {
           return res.status(422).json({
                success: false,
                msg: 'Role already exists.'
            });
        }

        const newRole = new dbContext.Role({
            roleName: role.roleName,
            clientId: req.clientId
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
        params.clientId = req.clientId;

        const employees = await businessLogic.EmployeeLogic.getEmployee(params);

        res.status(200).json({
            message: "Successfully retrieved all the employees",
            data: employees
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.get('/getRoles', async(req, res, next) => {

    if(!req.clientId){
        return res.status(422).json({
            success: false,
            msg: 'Client id is required',
        });
    }
    
    try {
        const roles = await dbContext.Role.find({clientId: conversion.ToObjectId(req.clientId)});
        res.status(200).json({
            message: "Successfully retrieved all the roles",
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

router.post('/updateEmployeeSchedule', async(req, res, next) => {
    try{
        await businessLogic.EmployeeDailyActivityLogic.updateEmployeeSchedule(req.body);
        res.status(200).json({
            success: true,
            message: "Updated employee schedule successfully"
        })
    }
    catch(err){

    }
})

async function checkIfEmployeeExists(email, firstName, lastName, clientId) {
    const user = await dbContext.Employee.findOne({ 
        firstName: firstName, 
        lastName: lastName, 
        'contactInfo.email': email,
        'meta.isDeleted': false,
        clientId: conversion.ToObjectId(clientId) });
    return user; // Returns null if user not found, otherwise returns the user object
}

module.exports = router;
