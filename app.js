//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mysql = require("mysql");



const app = express();
var _ = require('lodash');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

var totalRooms = 0;
var authentication = {
    "root" : "1234",
    "admin": "admin"
};


function authenticateUser(userName,userPassword)
{   var found = false;
    for(let keys in authentication)
    {  
        if ( userName == keys)
        {   
            if ( userPassword == authentication[keys])
            {   
                found = true;
                return true;
            }
        }
    }
    return found;
}


var mysqlConnection = mysql.createConnection({
    host : "localhost",
    user : "root",
    password : "Root@1234",
    database : "hospitaldbms",
    multipleStatements : true
});

mysqlConnection.connect(function(err){
    if(!err){
        console.log("CONNECTED TO DataBase");
    }
    else{
        console.log("FAILED");
        console.log(err);
    }
})



app.post("/password",function(req,res){
    var userName = req.body.user_name;
    var userPassword = req.body.user_password;
    var thePageToLoad = req.body.pageToGO;
    //console.log(req.body);
    var wrongPassMsg = "";
    //console.log("INSIDE PASSWORD POST")
    if(authenticateUser(userName,userPassword))
    {   if(thePageToLoad == "doctor ")
            res.redirect('/doctor');
        else{
            res.redirect('/patient');
        }
    }
    else
    {
        wrongPassMsg = "*Either the password or the username was wrong"
        res.render('password',{msgToDisplay : wrongPassMsg,linkname : thePageToLoad});
    }
});
///////////////////////////////////////FOR TRANSACTION ///////////////////////////////////////////////////
app.post('/transaction/',function(req,res){
    var pId = req.body.p_id;
    var eId = req.body.e_id;
    var roomNo = req.body.room_no;
    var admitDate = req.body.admit_date;
    var dischargeDate = req.body.discharge_date;
    var insertQueryTrans = 'INSERT INTO `transactions` (`p_id`, `e_id`, `admit_date`, `discharge_date`, `room_no`) VALUES (?,?,?,?,?);'
    var finalInsertQueryTrans = mysql.format(insertQueryTrans,[pId,eId,admitDate,dischargeDate,roomNo]);
    mysqlConnection.query(finalInsertQueryTrans,function(err,result){
        if (!err){
            res.render('afterInsert',{link : "patient"});
        }
        else{
            console.log(err);
        }
    })
    });
      
    
app.get('/transaction',function(req,res)
    {
        res.render('transactionpage.ejs');
    });

//////////////////////////////////////////////
app.get("/alldata",function(req,res)
{
var allViewQuerry = 'SELECT * FROM `all_view`;'
mysqlConnection.query(allViewQuerry,function(err,result){
    if (err) throw err;
    console.log(result);
    res.render('alldata',{records : result});
})
});


//////////////////////////////////////// FOR PATIENTS ///////////////////////////////////////////////////////
app.post("/patient",function(req,res){
    var pName = req.body.p_name;
    var pId = parseInt(req.body.p_id);
    var pSex = req.body.p_sex;
    var pAddress = req.body.p_address;
    var pContact = req.body.p_contact;
    var pAge = parseInt(req.body.p_age);
    var insertProcedureCall = 'call pat_insert(?,?,?,?,?,?);'
    var finalInsertProcedureCall = mysql.format(insertProcedureCall,[pId,pName,pAddress,pSex,pAge,pContact]);
    var noError = false;
    mysqlConnection.query(finalInsertProcedureCall,function(err,result){
        if(!err) {
            //res.render('afterInsert',{link : "patient"});
            // noError = true;
            console.log("Query ran successfully");
            res.redirect('/transaction');
        }
        else{
            console.log("THE ERROR IS :\n");
            console.log(err);
        }
    })
});

app.get('/patient',function(req,res){
    var searchQuery = 'SELECT * FROM `pat_view`;'
    var patFuncGet = 'SELECT count_room();'
    
    mysqlConnection.query(patFuncGet,function(err,result){
        //console.log(typeof(result[0]));
        var stringe=JSON.stringify(result);
        totalRooms = parseInt(stringe.slice(17,18));   
        console.log(totalRooms);
        console.log(typeof(totalRooms));
    })
    console.log("outside ",totalRooms);
    mysqlConnection.query(searchQuery,function(err,result){
        if(err) throw err;
        console.log("inside",totalRooms);
        res.render('patient',{ records : result.slice(0,5),noOfRec : result.length,linkMsg : "show all data",getMet : "pat_all_data",totalRooms : totalRooms -1} );
    });
});

app.get('/delete_pat/:id',function(req,res){
    var id = req.params.id;
    var deleteProcedureCall = 'call hospitaldbms.pat_delete(?);'
    var finalDeleteProcedureCall = mysql.format(deleteProcedureCall,[id]);
    var transDeleteQuery = 'DELETE FROM `transactions` WHERE p_id = ?;'
    var finalTransDeleteQuery = mysql.format(transDeleteQuery,[id]);
    mysqlConnection.query(finalTransDeleteQuery,function(err){
        if (err) throw err;
    });
    mysqlConnection.query(finalDeleteProcedureCall,function(err){
        if (err) throw err;
        res.redirect('/patient');
    });
});

app.get("/edit_pat/:id",function(req,res){
    var id = req.params.id;
    var queryForUpdate = 'SELECT * FROM `patient` WHERE `p_id` = ?;'
    var finalQueryForUpdate = mysql.format(queryForUpdate,[id]);
    mysqlConnection.query(finalQueryForUpdate,function(err,result){
        if (err) throw err;
        var string=JSON.stringify(result);
        var json =  JSON.parse(string);
        res.render('edit_patient', { title: 'Patient Record to be updated', records:json,success:'' });
    });   
})

app.post("/update_pat/",function(req,res){
    var pName = req.body.p_name;
    var pId = parseInt(req.body.p_id);
    var pSex = req.body.p_sex;
    var pAddress = req.body.p_address;
    var pContact = req.body.p_contact;
    var pAge = parseInt(req.body.p_age);
    var updateProcedureCall = 'call hospitaldbms.pat_update(?,?,?,?,?,?);'
    var finalUpdateProcedureCall = mysql.format(updateProcedureCall,[pName,pAddress,pSex,pAge,pContact,pId]);
    mysqlConnection.query(finalUpdateProcedureCall,function(err,result){
        if (err) throw err;
        res.redirect('/patient');
    });
});

app.get('/pat_all_data',function(req,res){
    var searchQuery = 'SELECT * FROM `patient`;'
    mysqlConnection.query(patFuncGet,function(err,result){
        //console.log(typeof(result[0]));
        var stringe=JSON.stringify(result);
        totalRooms = parseInt(stringe.slice(17,18));   
        console.log(totalRooms);
        console.log(typeof(totalRooms));
    })
    mysqlConnection.query(searchQuery,function(err,result){
        if(err) throw err;
        res.render('patient',{ records : result,noOfRec : result.length,linkMsg : "show less",getMet : "patient",totalRooms : totalRooms-1} );
    });
});



//////////////////////////////////////////// FOR DOCTOR ////////////////////////////////////////////////////// 
app.post("/doctor",function(req,res){
   
    var eName = req.body.e_name;
    var eId = parseInt(req.body.e_id);
    var eSex = req.body.e_sex;
    var eDepartment = req.body.e_department;
    var eExperiance = parseFloat(req.body.e_exp);
    var eContact = req.body.e_contact;
    var eSalary = parseInt(req.body.e_salary);
    var insertProcedureCall = 'call emp_insert(?,?,?,?,?,?,?);'
    var finalInsertProcedureCall = mysql.format(insertProcedureCall,[ eId , eName , eSex , eSalary , eDepartment , eExperiance , eContact ]);
    mysqlConnection.query(finalInsertProcedureCall,function(err,result){
        if(!err) {
            res.render('afterInsert',{link : "doctor"});
        }
        else{
            console.log("THE ERROR IS :\n");
            console.log(err);
        }
    })
});

app.get("/edit_doc/:id",function(req,res){
    //console.log(req.params.id);
    var id = req.params.id;
    var queryForUpdate = 'SELECT * FROM `employee` WHERE `e_id` = ?;'
    var finalQueryForUpdate = mysql.format(queryForUpdate,[id]);
    mysqlConnection.query(finalQueryForUpdate,function(err,result){
        if (err) throw err;
        var string=JSON.stringify(result);
        var json =  JSON.parse(string);
        res.render('edit', { title: 'Employee Record to be updated', records:json,success:'' });
    });   
});


app.get("/delete_doc/:id",function(req,res){
    var id = req.params.id;
    var deleteProcedureCall = 'call emp_delete(?);'
    var finalDeleteProcedureCall = mysql.format(deleteProcedureCall,[id]);
    var transDeleteQuery = 'DELETE FROM `transactions` WHERE e_id = ?;'
    var finalTransDeleteQuery = mysql.format(transDeleteQuery,[id]);
    mysqlConnection.query(finalTransDeleteQuery,function(err){
        if (err) throw err;
    })
    mysqlConnection.query(finalDeleteProcedureCall,function(err){
        if (err) throw err;
        res.redirect('/doctor');
    })
    
});


app.post("/update_doc/",function(req,res){
    var eName = req.body.e_name;
    var eId = parseInt(req.body.e_id);
    var eSex = req.body.e_sex;
    var eDepartment = req.body.e_department;
    var eExperiance = parseFloat(req.body.e_exp);
    var eContact = req.body.e_contact;
    var eSalary = parseInt(req.body.e_salary);
    var updateProcedureCall = 'call emp_update(?,?,?,?,?,?,?);'
    var finalUpdateProcedureCall = mysql.format(updateProcedureCall,[eId, eName , eSex , eSalary , eDepartment , eExperiance , eContact]);
    
    mysqlConnection.query(finalUpdateProcedureCall,function(err,result){
        if(err) throw err;
        res.redirect('/doctor');
    })
});


app.get("/searchDoc",function(req,res){
res.render('searchDoc');
});

app.get("/",function(req,res){
    res.render('home');
});

app.get("/doctor",function(req,res){
    var searchQuery = 'SELECT * FROM `doc_view`;'
    mysqlConnection.query(searchQuery,function(err,result){
        if(err) throw err;
        //console.log(result)
        res.render('doctor',{ records : result.slice(0,5),noOfRec : result.length,linkMsg : "show all data",getMet : "doc_all_data" });
    })
});

app.get('/doc_all_data',function(req,res){
    var searchQuery = 'SELECT * FROM `employee`;'
    mysqlConnection.query(searchQuery,function(err,result){
        if(err) throw err;
        //console.log(result)
        res.render('doctor',{ records : result,noOfRec : result.length,linkMsg : "show all data",getMet : "doctor" });
    })
});

app.get("/password/:access",function(req,res){
    var access = req.params.access;
    //console.log(access);
    res.render('password',{ msgToDisplay : " ",linkname : access});
})

app.get("/afterInsert",function(req,res){
    res.render('afterInsert',{link : "doctor"});
});
app.get('/aboutus',function(req,res){
    res.render('aboutus');
})

app.listen(3000,function(){
console.log("Server is running on port 3000");
})

