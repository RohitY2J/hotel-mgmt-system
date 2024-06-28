const express = require('express')
const router = express.Router()

const dbContext = require('../../model');

router.post('/createEmployee', async (req, res, next) => {
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
            }
        });

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

async function checkIfEmployeeExists(email, firstName, lastName) {
    const user = await dbContext.Employee.findOne({ 
        firstName: firstName, 
        lastName: lastName, 
        'contactInfo.email': email });
    return user; // Returns null if user not found, otherwise returns the user object
}

module.exports = router;
