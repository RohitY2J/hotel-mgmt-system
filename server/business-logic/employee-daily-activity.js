const dbContext = require('../model');
const conversion = require('../helper/conversion');
const { schedule } = require('node-cron');

exports.createDailyActivityRecord = async () => {
  try {
    const employees = await dbContext.Employee.find();

    let today = conversion.DateToString(new Date());
    for (const employee of employees) {
      const existingAttendance = await dbContext.ExployeeDailyActivity.findOne({
        date: today,
        employee: employee._id
      });

      if (!existingAttendance) {
        const attendance = new dbContext.ExployeeDailyActivity({
          date: today,
          employee: employee._id,
          attendanceStatus: 0, // Default to 'Scheduled'
          shift: 0,
          shiftStart: new Date(), // Default shift start time
          shiftEnd: new Date(), // Default shift end time
          shiftStatus: 0,
          tasks: 'N/A', // You can customize this as needed
        });

        await attendance.save();
      }
    }
  } catch (error) {
    console.error('Error creating attendance records:', error);
  }
};

exports.getEmployeeSchedules = async (filterParams) => {
  let filter = {};
  if (filterParams.searchText) {

  }

  const employeeSchedule = await dbContext.ExployeeDailyActivity.find(filter).populate({
    path: 'employee',
    populate: {
      path: 'role'
    }
  });

  
  employeeSchedule.forEach(schedule => {
    let profilePics = schedule.employee.documents.find(x => x.documentType === "ProfilePic");
    if (profilePics) {
      let fileName = profilePics.fileObject;
      schedule._doc.employee._doc.profilePicUrl = "http://localhost:8000/uploads/" + fileName;
    }
    else {
      schedule._doc.employee._doc.profilePicUrl = null;
    }
  })
  
  return employeeSchedule;
    
  
}
