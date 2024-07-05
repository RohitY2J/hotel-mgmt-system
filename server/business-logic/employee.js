const dbContext = require('../model');
const conversion = require('../helper/conversion');


exports.getEmployee = async (filterParams) => {

    page = filterParams.pagination.page ?? 1;
    pageSize = filterParams.pagination.pageSize ?? 5;
    
    let beforeLookUpFilter = {'meta.isDeleted': false};

    let afterLookUpFilter = {};

    if(filterParams.searchText){
        beforeLookUpFilter.$or = [
            { firstName: { $regex: new RegExp(filterParams.searchText, 'i') } },
            { lastName: { $regex: new RegExp(filterParams.searchText, 'i') } },
            { 'contactInfo.email': { $regex: new RegExp(filterParams.searchText, 'i') }}
        ];
    }
  
  
    const pipeline = [
      { $match: beforeLookUpFilter }, // Match initial filter conditions
      {
        $lookup: {
          from: 'roles', // Assuming 'roles' is the collection name
          localField: 'role',
          foreignField: '_id',
          as: 'role'
        }
      },
      { $unwind: '$role' }, // Deconstruct the 'role' array
      {
        $match: afterLookUpFilter // Use the afterLookupFilter variable for $match stage
      },
      { $skip: (page - 1) * pageSize }, // Skip documents for pagination
      { $limit: pageSize }  // Limit the number of documents returned
    ];
  
    const employees = await dbContext.Employee.aggregate(pipeline).exec();
  
  
    employees.forEach(employee => {
        let profilePics = employee.documents.find(x => x.documentType === "ProfilePic");
        if(profilePics ){
            let fileName = profilePics.fileObject;
            employee.profilePicUrl = "http://localhost:8000/uploads/"+fileName;
        }
        else{
            employee.profilePicUrl = null;
        }
    });
  
    return employees;
  
  
  }