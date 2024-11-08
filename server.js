var express = require("express");
var path = require("path");
var mysql2 = require("mysql2");
var fileuploader = require("express-fileupload");

var app = express();
app.listen(2000, function () {
  console.log("server started...");
})
//==================================================

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(fileuploader());
//==================================================

app.get("/", function (req, resp) {
  var path = process.cwd() + "/public/index.html";
  resp.sendFile(path);
});
//==================================================

app.get("/", function (req, resp) {
  var path = process.cwd() + "/public/dash-admin.html";
  resp.sendFile(path);
});
//==================================================

app.get("/", function (req, resp) {
  var path = process.cwd() + "/public/post-med.html";
  resp.sendFile(path);
});
//==================================================

var dbConfiguration = {
  host: "localhost",
  user: "root",
  password: "mishurishu@22",
  database: "medicine",
  dateStrings:true
  
};
//==================================================

var dbRef = mysql2.createConnection(dbConfiguration);
dbRef.connect(function (err) {
  if (err == null)
    console.log("Mysql Server Connected");
  else
    console.log(err.message);
});
//==================================================

app.get("/db-signup", function (req, resp) {
  var data = [req.query.email, req.query.pwd, req.query.type];
  dbRef.query("insert into users value(?,?,?,1)", data, function (err) {
    if (err) {
      resp.send("Already a User");
    }
    else {
      resp.send("Signed Up Successfully......");
    }
  });
});
//==================================================

app.get("/db-login", function (req, resp) {
  var data = [req.query.email, req.query.pwd];
  dbRef.query("select * from users where email=? and password=?", data, function (err, table) {
    if (err != null)
      resp.send(err.toString());

    else if (table.length == 1) {
      if (table[0].status == 1) {
        if (table[0].usertype == "Donor")
          resp.send("Donor Logined");
        else if (table[0].usertype == "Receiver")
          resp.send("Receiver Logined");
      }
      else if (table[0].status == 0) {
        resp.send("You Are Blocked");
      }
    }
    else
      resp.send("Invalid(Plz Check Email Or Password)");
  });
});
//==================================================


//==================================================

app.post("/profile-save", function (req, resp) {
  console.log(req.body);

  var email = req.body.email;
  var fname = req.body.fname;
  var lname = req.body.lname;
  var gender = req.body.gender;
  var dob = req.body.dob;
  var address = req.body.address;
  var mobile = req.body.mobile;
  var state = req.body.state;
  var city = req.body.city;
  var pincode = req.body.pin;
  var idproof = req.body.proof;
  var proofpic = email + "-" + req.files.profilepic.name;
  var info = req.body.info;
  var password = req.body.pwd;

  var des = path.join(__dirname, "public", "uploads", proofpic);
  req.files.profilepic.mv(des, function (err) {
    if (err)
      console.log(err);
    else
      console.log(req.files.profilepic.name + "uploaded");
  })

  var data = [email, fname, lname, gender, dob, address, mobile, state, city, pincode, idproof, proofpic, info, password];
  dbRef.query("insert into donorprofile values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", data, function (err) {
    if (err)
      resp.send(err);
    else
      resp.send("Data Saved");
  });
});
//==================================================

app.post("/profile-edit", function (req, resp) {
  console.log(req.body);

  var email = req.body.email;
  var fname = req.body.fname;
  var lname = req.body.lname;
  var gender = req.body.gender;
  var dob = req.body.dob;
  var address = req.body.address;
  var mobile = req.body.mobile;
  var state = req.body.state;
  var city = req.body.city;
  var pincode = req.body.pin;
  var idproof = req.body.proof;
  var info = req.body.info;

  var fileName;
  if (req.files != null) {
    fileName = email + "-" + req.files.profilepic.name;
    var des = path.join(__dirname, "public", "uploads", fileName);
    req.files.profilepic.mv(des, function (err) {
      if (err)
        console.log(err.toString());
      else
        console.log("File Uploaded");
    })
  }
  else
    fileName = req.body.hidn;

  var dataAry = [fname, lname, gender, dob, address, mobile, state, city, pincode, idproof, fileName, info, email];
  dbRef.query("update donorprofile set fname=?,lname=?,gender=?,dob=?,address=?,mobile=?,state=?,city=?,pincode=?,idproof=?,proofpic=?,info=? where email=?", dataAry, function (err, result) {
    if (err)
      resp.send(err);

    if (result.affectedRows== 1)
      resp.send("Data Updated");
    else
      resp.send("Invalid Details");
  })
});
//==================================================
app.get("/updrec", function(req, resp) {
  console.log("Received request:", req.query); // This will log the incoming query parameters
  const { email, pwd, newpwd } = req.query;
  const userCheckQuery = "SELECT * FROM users WHERE email = ? AND password = ?";

  dbRef.query(userCheckQuery, [email, pwd], function(err, result) {
    if (err) {
      console.log("Error selecting user:", err);
      resp.send(err);
    } else if (result.length === 1) {
      const updatePasswordQuery = "UPDATE users SET password = ? WHERE email = ?";
      const updateDonorProfileQuery = "UPDATE donorprofile SET password = ? WHERE email = ?";

      // Start transaction to update both tables
      dbRef.beginTransaction(function(err) {
        if (err) { 
          resp.send("Transaction Error: " + err);
          return;
        }

        // Update users table
        dbRef.query(updatePasswordQuery, [newpwd, email], function(err, result) {
          if (err) {
            dbRef.rollback(function() {
              console.log("Error updating users table:", err);
              resp.send(err);
            });
            return;
          }

          // Update donorprofile table
          dbRef.query(updateDonorProfileQuery, [newpwd, email], function(err, result) {
            if (err) {
              dbRef.rollback(function() {
                console.log("Error updating donorprofile table:", err);
                resp.send(err);
              });
              return;
            }

            // Commit both updates
            dbRef.commit(function(err) {
              if (err) {
                dbRef.rollback(function() {
                  console.log("Error during commit:", err);
                  resp.send("Commit Error: " + err);
                });
                return;
              }
              resp.send("Password successfully updated");
            });
          });
        });
      });
    } else {
      resp.send("Invalid old password");
    }
  });
});

//==================================================
app.post("/receiver-save", function (req, resp) {
  console.log(req.body);

  var email = req.body.email;
  var fname = req.body.fname;
  var lname = req.body.lname;
  var gender = req.body.gender;
  var mobile = req.body.mobile;
  var address = req.body.address;
  var state = req.body.state;
  var city = req.body.city;
  var pin = req.body.pin;
  var idproof = req.body.proof;
  var proofno = req.body.proofno;
  var proofpic = email + "-" + req.files.proofpic.name;
  var info = req.body.info;
  var password = req.body.pwd;

  var des = path.join(__dirname, "public", "uploads", proofpic);
  req.files.proofpic.mv(des, function (err) {
    if (err)
      console.log(err);
    else
      console.log(req.files.proofpic.name + "uploaded");
  })

  var data = [email, fname, lname, gender, mobile, address, state, city, pin, idproof, proofno, proofpic, info, password];
  dbRef.query("insert into receiverprofile values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", data, function (err) {
    if (err)
      resp.send(err);
    else
      resp.send("Record Saved....");
  });
});
//==================================================

app.post("/receiver-edit", function (req, resp) {
  console.log(req.body);

  var email = req.body.email;
  var fname = req.body.fname;
  var lname = req.body.lname;
  var gender = req.body.gender;
  var mobile = req.body.mobile;
  var address = req.body.address;
  var state = req.body.state;
  var city = req.body.city;
  var pin = req.body.pin;
  var idproof = req.body.proof;
  var idno = req.body.proofno;
  var info = req.body.info;

  var fileName;
  if (req.files != null) {
    fileName = email + "-" + req.files.proofpic.name;
    var des = path.join(__dirname, "public", "uploads", fileName);
    req.files.proofpic.mv(des, function (err) {
      if (err)
        console.log(err.toString());
      else
        console.log("File Uploaded"); 
    })
  }
  else
    fileName = req.body.hidn;

  var dataAry = [fname, lname, gender, mobile, address, state, city, pin, idproof, idno, fileName, info, email];
  dbRef.query("update receiverprofile set fname=?,lname=?,gender=?,mobile=?,address=?,state=?,city=?,pin=?,idproof=?,idno=?,pic=?,info=? where email=?", dataAry, function (err, result) {
    if (err)
      resp.send(err);

    if (result.affectedRows== 1)
      resp.send("Data Updated");
    else
      resp.send("Invalid Details");
  })
});
//==================================================

app.get("/updReceiverPwd", function(req, resp) {
  console.log("Received request:", req.query); // This will log the incoming query parameters
  const { email, pwd, newpwd } = req.query;
  const userCheckQuery = "SELECT * FROM users WHERE email = ? AND password = ?";

  dbRef.query(userCheckQuery, [email, pwd], function(err, result) {
    if (err) {
      console.log("Error selecting user:", err);
      resp.send(err);
    } else if (result.length === 1) {
      const updatePasswordQuery = "UPDATE users SET password = ? WHERE email = ?";
      const updateReceiverProfileQuery = "UPDATE receiverprofile SET password = ? WHERE email = ?";

      // Start transaction to update both tables
      dbRef.beginTransaction(function(err) {
        if (err) { 
          resp.send("Transaction Error: " + err);
          return;
        }

        // Update users table
        dbRef.query(updatePasswordQuery, [newpwd, email], function(err, result) {
          if (err) {
            dbRef.rollback(function() {
              console.log("Error updating users table:", err);
              resp.send(err);
            });
            return;
          }

          // Update receiverprofile table
          dbRef.query(updateReceiverProfileQuery, [newpwd, email], function(err, result) {
            if (err) {
              dbRef.rollback(function() {
                console.log("Error updating receiverprofile table:", err);
                resp.send(err);
              });
              return;
            }

            // Commit both updates
            dbRef.commit(function(err) {
              if (err) {
                dbRef.rollback(function() {
                  console.log("Error during commit:", err);
                  resp.send("Commit Error: " + err);
                });
                return;
              }
              resp.send("Password successfully updated");
            });
          });
        });
      });
    } else {
      resp.send("Invalid old password");
    }
  });
});

//==================================================

app.get("/search-receiver", function (req, resp) {
  
  var data = [req.query.email];

  dbRef.query("select * from receiverprofile where email=?", data, function (err, table) {
    if (err != null)
      resp.send(err.message);
    else
      resp.send(table);
  })
});
//==================================================

app.get("/search-donor",function(req,resp){
  console.log(req.query);
  var data = [req.query.email];

  dbRef.query("select * from donorprofile where email=?", data, function (err, table) {
    if (err != null)
      resp.send(err.message);
    else
      resp.send(table);
  });
});
//==================================================
app.post("/post-med-save", function (req, resp) {
  console.log(req.body);

  var email = req.body.email;
  var medname = req.body.medname;
  var company = req.body.company;
  var salt = req.body.salt;
  var expdate = req.body.expdate;
  var medtype = req.body.medtype;
  var qty = req.body.qty;
  var proofpic = email + "-" + req.files.profilePic.name; 

  var des = path.join(__dirname, "public", "uploads", proofpic);
  req.files.profilePic.mv(des, function (err) {
    if (err)
      console.log(err);
    else
      console.log(req.files.profilePic.name + "uploaded");
  })

  var data = [email, medname, company, salt, expdate, medtype, qty, proofpic];
  dbRef.query("insert into medicines values(?,?,?,?,?,?,?,?)", data, function (err) {
    if (err)
      resp.send(err);
    else
      resp.send("Record Saved....");
  });
});
//==================================================
app.post("/med-edit", function(req, resp) {
  
  var email = req.body.email;
  var medname = req.body.medname;
  var company = req.body.company;
  var salt = req.body.salt;
  var exp = req.body.expdate;
  var medtype = req.body.medtype;
  var qty = req.body.qty;

  var fileName;
  if (req.files != null) {
    fileName = email + "-" + req.files.profilePic.name;
    var des = path.join(__dirname, "public", "uploads", fileName);
    req.files.profilePic.mv(des, function (err) {
      if (err)
        console.log(err.toString());
      else
        console.log("File Uploaded");
    }) 
  }
  else
    fileName = req.body.hidn;

  var dataAry = [medname, company, salt, exp, medtype, qty, fileName, email];
  dbRef.query("update medicines set medname=?,company=?,salt=?,exp=?,medtype=?,qty=?,proofpic=? where email=?", dataAry, function (err, result) {
    if (err)
      resp.send(err);

    if (result.affectedRows== 1)
      resp.send("Data Updated");
    else
      resp.send("Invalid Details");
  })
});
//==================================================
app.get("/show-all-users", function (req, resp) {
  dbRef.query("select * from users", function (err, table) {
    if (err)
      resp.send(err.sqlMessage);
    else
      resp.json(table); 
  })
});
//==================================================

app.get("/block-user", function (req, resp) {
  var data = [req.query.Email];
  dbRef.query("update users set status=0 where email=?", data, function (err, table) {
    if (err)
      resp.send(err.sqlMsg);
    else
      resp.json(table);
  })
});
//==================================================

app.get("/activate-user", function (req, resp) {
  var data = [req.query.Email];
  dbRef.query("update users set status=1 where email=?", data, function (err, table) {
    if (err)
      resp.send(err.sqlMsg);
    else
      resp.json(table);
  })
});
//==================================================

app.get("/show-donor-profile", function (req, resp) {
  dbRef.query("select * from donorprofile", function (err, table) {
    if (err)
      resp.send(err.sqlMessage);
    else
      resp.json(table);
  })
});
//==================================================

app.get("/delete-donor", function (req, resp) {
  var dataAry = [req.query.email];

  dbRef.query("delete from donorprofile where email=?", dataAry, function (err, table) {
    if (err)
      resp.send(err.sqlMessage);
    else
      if (table.affectedRows == 1)
        resp.send("Deleted");
      else
        resp.send("Invalid ID");
  })
});
//==================================================

app.get("/show-receiver-profile", function (req, resp) {
  dbRef.query("select * from receiverprofile", function (err, table) {
    if (err)
      resp.send(err.sqlMessage);
    else
      resp.json(table);
  })
});
//==================================================

app.get("/delete-receiver", function (req, resp) {
  var dataAry = [req.query.email];

  dbRef.query("delete from receiverprofile where email=?", dataAry, function (err, table) {
    if (err)
      resp.send(err.sqlMessage);
    else if (table.affectedRows == 1)
      resp.send("Deleted");
    else
      resp.send("Invalid ID");
  })
});
//==================================================

app.get("/fetch-all-cities", function (req, resp) {
  dbRef.query("select distinct city from donorprofile", function (err, table) {
    if (err)
      resp.send(err.sqlMsg);
    else
      resp.send(table);
  });
});
//==================================================

app.get("/fetch-all-meds", function (req, resp) {
  dbRef.query("select distinct medname from medicines", function (err, table) {
    if (err)
      resp.send(err.sqlMsg);
    else
      resp.send(table);
  });
});
//==================================================

app.get("/fetch-all-donors", function (req, resp) {
  var data = [req.query.city,req.query.medname];
  dbRef.query("SELECT * FROM medicines INNER JOIN donorprofile ON medicines.email=donorprofile.email where city=? and medname=?", data, function (err, table) {
    if (err)
      resp.send(err.sqlMsg);
    else
      resp.send(table);
  });
});

//==================================================

app.get("/moreInfo", function (req, resp) {
  var email = req.query.Email;
  dbRef.query("SELECT * FROM donorprofile WHERE email=?", [email], function (err, table) {
    if (err)
      resp.send(err.sqlMsg);
    else
      resp.send(table);
  });
});

