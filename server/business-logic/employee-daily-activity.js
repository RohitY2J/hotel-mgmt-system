const dbContext = require('../model');
const conversion = require('../helper/conversion');
const env = require('../../env/nodeEnv');

exports.createDailyActivityRecord = async () => {
  try {
    const employees = await dbContext.Employee.find({"meta.isDeleted": false});

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

  page = filterParams.pagination.page ?? 1;
  pageSize = filterParams.pagination.pageSize ?? 5;
  let beforeLookUpFilter = {};
  let afterLookUpFilter = {'employee.meta.isDeleted': false};
  
  if (filterParams.shift) {
    beforeLookUpFilter.shift = conversion.convertStringToInt(filterParams.shift);
  }
  if (filterParams.date && (validationDateResult = conversion.ValidateStringDate(filterParams.date)).isValid) {
    beforeLookUpFilter.date = validationDateResult.formattedDate;
  }
  if (filterParams.searchText) {
    const searchTextRegex = new RegExp(filterParams.searchText, 'i'); // 'i' for case-insensitive

    // Modify the filter to include the search condition
    afterLookUpFilter.$or = [
      { 'employee.firstName': searchTextRegex },
      { 'employee.lastName': searchTextRegex },
      { 'employee.contactInfo.email': searchTextRegex }
    ];
  }

  if (filterParams.role) {
    afterLookUpFilter.$and = [
      { 'employee.role._id': conversion.ToObjectId(filterParams.role) }
    ];
  }


  const pipeline = [
    { $match: beforeLookUpFilter }, // Match initial filter conditions
    {
      $lookup: {
        from: 'employees', // Assuming 'employees' is the collection name
        localField: 'employee',
        foreignField: '_id',
        as: 'employee'
      }
    },
    { $unwind: '$employee' }, // Deconstruct the 'employee' array
    {
      $lookup: {
        from: 'roles', // Assuming 'roles' is the collection name
        localField: 'employee.role',
        foreignField: '_id',
        as: 'employee.role'
      }
    },
    { $unwind: '$employee.role' }, // Deconstruct the 'role' array
    {
      $match: afterLookUpFilter // Use the afterLookupFilter variable for $match stage
    },
    { $skip: (page - 1) * pageSize }, // Skip documents for pagination
    { $limit: pageSize }  // Limit the number of documents returned
  ];

  const employeeSchedule = await dbContext.ExployeeDailyActivity.aggregate(pipeline).exec();


  employeeSchedule.forEach(schedule => {
    let profilePics = schedule.employee.documents.find(x => x.documentType === "ProfilePic");
    if (profilePics) {
      let fileName = profilePics.fileObject;
      schedule.employee.profilePicUrl = env.serverUrl+"/uploads/" + fileName;
    }
    else {
      schedule.employee.profilePicUrl = null;
    }
  })

  return employeeSchedule;


}

exports.updateEmployeeSchedule = async(scheduleData) => {
   employeeSchedule = await dbContext.ExployeeDailyActivity.findOne({_id: scheduleData.scheduleId}).exec();

   employeeSchedule.shift = scheduleData.shift;
   employeeSchedule.attendanceStatus = scheduleData.attendance;
   employeeSchedule.shiftStatus = scheduleData.shiftStatus;

   await employeeSchedule.save();
   return;
}
