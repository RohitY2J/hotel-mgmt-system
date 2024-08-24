const dbContext = require('../model');
const conversion = require('../helper/conversion');
const env = require('../../env/nodeEnv');


exports.getEmployee = async (filterParams) => {

    page = filterParams.pagination.page ?? 1;
    pageSize = filterParams.pagination.pageSize ?? 5;
    
    let beforeLookUpFilter = {'meta.isDeleted': false, "clientId": conversion.ToObjectId(filterParams.clientId)};

    let afterLookUpFilter = {};

    if(filterParams.searchText){
      const names = filterParams.searchText.split(' ');
      beforeLookUpFilter.firstName = names[0];
      if(names[1]){
        beforeLookUpFilter.lastName = names[1];
      }
    }

    if (filterParams.role) {
      afterLookUpFilter.$and = [
        { 'role._id': conversion.ToObjectId(filterParams.role) }
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
            employee.profilePicUrl = env.serverUrl+"/uploads/"+fileName;
        }
        else{
            employee.profilePicUrl = null;
        }
    });
  
    return employees;
  
  
  }