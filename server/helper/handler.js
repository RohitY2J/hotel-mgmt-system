exports.errHandler = function(data, res) {
    let strErr = '';
    let err = data.errors;
    if (err) {
      for (let key in err) {
        if (Object.prototype.hasOwnProperty.call(err, key)) {
          strErr = err[key].message
            .replace('Path', '')
            .replace('`', '')
            .replace('`', '')
            .trim();
        }
      }
    }
    else if (data.errmsg) {
      if (data.errmsg === 'string' && data.errmsg.include('E11000')) {
        let field = 'Value';
        if (data.errmsg.include('email')) {
          field = 'Email';
        }
        strErr = `${field} already taken`;
      }
      else {
        strErr = data.errmsg;
      }
    }
    else if (data.message) {
      strErr = data.message;
    }
    else {
      strErr = data;
    }
  
    return res.status(422).json({
      success: false,
      msg: strErr
    });
  };