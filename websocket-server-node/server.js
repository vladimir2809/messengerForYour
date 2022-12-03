const WebSocket = require('ws');
const webServer = new WebSocket.Server({port:9000});
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/messanger');
var usersSchema = require('./schemesForMessanger.js').usersSchema;
var messagesSchema = require('./schemesForMessanger.js').messagesSchema;
var usersDB = mongoose.model('Users',usersSchema);
var messagesDB = mongoose.model('messages',messagesSchema);
//var messageSchema = require('./schemaForMessanger.js').messageSchema;
//var messageDB = mongoose.model('Messanges',messageSchema);
var countMes=0;
var countUser=0;// счетчик пользователей
const sockets = {};

var user = {
    id:null,
    login:'',
    raceMess:false,
    online:false,

}
loginArr = {
    arr:[],
    flag: false,
}
var userArr = [];
var contact={
    login:'',
    countMes:0,
}
var contactUserArr = [];
var countMessage = [];
var countMesFlag=false;
var countMesTrigerFlag = false;
var contactFlag = false;
// функция отправки сообщения конкретному сокету
function to(user, data) {

    if(sockets[user] && sockets[user].readyState === WebSocket.OPEN)
        sockets[user].send(data);
}
mongoose.connection.on('open', function () {
    console.log('mongoose open');
});
webServer.on('connection', (ws) => {

    const userId = countUser;
    // регистрируем сокет и пользователя
    var   userOne=JSON.parse(JSON.stringify(user));;
    userOne.id = userId;
    userOne.online = true;
    userArr.push(userOne);
    countUser++;
    sockets[userId] = ws;
    console.log('connect');
    console.log(userArr);

    ws.on('message', function incoming(message) {
        // Or get user in here
        var jsonMessage = JSON.parse(message);// распарским сообшение от клиентов
        if (jsonMessage.action == 'REGISTRATION')// пользователь зарегался
        {
            userArr[userArr.length - 1].login = jsonMessage.data;
            userArr[userArr.length - 1].raceMess = true;
            var query = usersDB.count();
            query.where('login', jsonMessage.data);
            //  console.log(query);
            query.exec(function (err, count) {
                if (count > 0) {
                    to(userId, JSON.stringify({ action: 'BEUSERNAME' }))
                }
                else {
                    saveUserBd(jsonMessage.data);
                    to(userId, JSON.stringify({ action: 'NEWUSEROK', data: jsonMessage.data }));
                }
            });

        }
        else if (jsonMessage.action == 'LOGIN')// пользователь вошел в систему
        {
            userArr[userArr.length - 1].login = jsonMessage.data;
            userArr[userArr.length - 1].raceMess = true;

        //    console.log(userArr);
            let login = userArr[userArr.length - 1].login;
            let flagDoubleLogin = false;
            //saveUserBd(jsonMessage.data);
            //var newUser = new usersDB({
            //    login: jsonMessage.data,
            //});
            //console.log('Is Document new?' + newUser.isNew+ newUser);
            //newUser.save(function (err, doc) {
            //    console.log("\nSaved document: " + doc + '\n' + err);
            //}); 
            // calcUserArr();
            for (let i = 0; i < userArr.length-1;i++)
            {
                var numLength = userArr.length - 1;
                if (userArr[numLength] && userArr[i] && userArr[i].login==userArr[numLength].login 
                    && userArr[numLength].raceMess==true)
                {                                                  
                    to(numLength,JSON.stringify({action:'DOUBLELOGIN',data:null}));
                    console.log('i='+i);
                    flagDoubleLogin = true;
                }
            }
            if (flagDoubleLogin==false)
            {
                var queryBeLogin = usersDB.findOne().where({ login: jsonMessage.data });
                queryBeLogin.exec(function (err, res) {
                   // console.log(res);
                    if (res==null)
                    {
                        for (let i = 0; i < userArr.length;i++)
                        {
                            if (userArr[i] && userArr[i].login==jsonMessage.data && userArr[i].raceMess==true)
                            {
                                to(i,JSON.stringify({action:'NOLOGIN',data:null}));
                                console.log('i='+i);
                            }
                        }
                    }
                    else
                    {
                        for (let i = 0; i < userArr.length;i++)
                        {
                            if (userArr[i] && userArr[i].login==jsonMessage.data && userArr[i].raceMess==true)
                            {
                                to(i,JSON.stringify({action:'YESLOGIN',data:null}));
                                console.log('i='+i);
                            }
                        }
                    }
                });
            }
            
           
            getContacts(userArr[userArr.length - 1].login);
           // getCountMessage('1');
            var interval = setInterval(function () {
                if (contactFlag==true )
                {
                    //var userArrLogin = loginArr.arr;
                    var userArrLogin = contactUserArr;
                    console.log('USERARRLOGIN: '+userArrLogin);
                    if (countMesTrigerFlag==false)
                    {
                        getCountMessage(userArrLogin);
                        countMesTrigerFlag = true;
                    }
                    if (countMesFlag==true)
                    {

                        for (let i = 0; i < userArr.length;i++)
                        {
                            if (userArr[i] && userArr[i].login==jsonMessage.data && userArr[i].raceMess==true)
                            {
                                to(i,JSON.stringify({action:'USERS',loginArr:userArrLogin,countMessage:countMessage}));
                                console.log('i='+i);
                            }
                        //}

                        }
                        console.log(countMessage);
                        let time = new Date();
                        console.log(time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds());
                        countMesTrigerFlag = false;
                        clearInterval(interval);
                        
                    }
                    
                }
            }, 100);
        }

        else if(jsonMessage.action=='MESSAGE')// пришло сообшение
        {
     

            // запрос на поиск собшения по отправителю и получателю
            var query = messagesDB.findOne().or([
                {$and: [{'login1': jsonMessage.sender}, {'login2': jsonMessage.host} ]},
                {$and: [{'login2': jsonMessage.sender}, {'login1': jsonMessage.host }]},
            ]);
            query.exec(function (err, doc1) {
                if (doc1!=null) // если есть совпадения
                {
                    // сохраним сообшение в конкретную ветку 
                    console.log('\n Document' + doc1);
                    var query=doc1.updateOne({
                        $push:{ 
                            messageArr: { 
                                "loginSender": jsonMessage.sender,
                                "loginHost": jsonMessage.host,
                                "message":jsonMessage.data,
                                'status':1,
                            }
                    } });
                    query.exec(function (err, res) {
                        console.log(res);

                    });
                }
                else// если нет совпадениий
                {
                    // сохраним новое сообшение в начале переписки
                    var newMessage = new messagesDB({
                        login1: jsonMessage.sender,
                        login2: jsonMessage.host,
                        messageArr: [{ loginSender: jsonMessage.sender,loginHost: jsonMessage.host, message: jsonMessage.data,status:1 }],
                    });
                    console.log('NEW MESSAGE');
                    newMessage.save(function (err, doc) {
                        console.log("\nSaved document of message: " + doc + '\n' + err);
                        // сохраним новый контакт у отправителя
                        var queryUserSender = usersDB.findOne().where({ login: jsonMessage.sender }); 
                        queryUserSender.exec(function (err, user){
                            var queryContact = user.updateOne({
                                $push: {
                                    contactArr: {
                                        loginHost: jsonMessage.host,
                                    }
                                }
                            });
                            queryContact.exec(function (err, res) {
                                console.log('new contact:'+jsonMessage.host +err);
                            });

                       // }};
                        });
                        var queryUserHost = usersDB.findOne().where({ login: jsonMessage.host }); 
                        queryUserHost.exec(function (err, user){
                            var queryContact = user.updateOne({
                                $push: {
                                    contactArr: {
                                        loginHost: jsonMessage.sender,
                                    }
                                }
                            });
                            queryContact.exec(function (err, res) {
                                console.log('new contact:'+jsonMessage.host +err);
                            });

                       // }};
                        });

                    });
                    
                }
            });
            for (let i = 0; i < userArr.length;i++)
            {
                if (userArr[i] && userArr[i].login==jsonMessage.host && userArr[i].raceMess==true)
                {
                    to(i,JSON.stringify({ action: 'TEXT', sender:jsonMessage.sender ,data: jsonMessage.data}))
                }
            }
        }
        else if(jsonMessage.action=='GETMESSAGELIST')
        {
             var query = messagesDB.findOne().or([
                {$and: [{'login1': jsonMessage.sender}, {'login2': jsonMessage.host} ]},
                {$and: [{'login2': jsonMessage.sender}, {'login1': jsonMessage.host }]},
            ]);
            query.exec(function (err, doc) {
                //console.log('MESSAGELIST');
                //console.log(doc);
                let numUserId = null;
                for (let i = 0; i < userArr.length;i++)
                {
                    if (userArr[i] && userArr[i].login==jsonMessage.sender && userArr[i].raceMess==true)
                    {
                        numUserId = i;
                        break;
                    }

                //}

                }
                if (doc!=null)
                {
                    to(numUserId, JSON.stringify({ action: 'MESSAGELIST', messageArr: doc.messageArr }));
                    console.log(doc);
                    for (let i = 0; i < doc.messageArr.length;i++)
                    {
                        if (doc.messageArr[i].loginHost==userArr[numUserId].login)
                        {
                            doc.messageArr[i].status = 2;
                        }
                    }
                    doc.save(function (err, res) {
                        console.log('status change');
                    })
                    //var query=doc1.updateOne({
                    //$push:{ 
                    //    messageArr: { 
                    //        "loginSender": jsonMessage.sender,
                    //        "loginHost": jsonMessage.host,
                    //        "message":jsonMessage.data,
                    //        'status':1,
                    //    }
                    //} });
                    //query.exec(function (err, res) {
                    //    console.log(res);

                    //});
                    //var query1=doc.find({
                    //    $elemMatch:{ 
                    //        messageArr: {
                    //            'status':1,
                    //        }
                    //} });
                    //query1.exec(function (err, doc1) {
                    //    console.log(doc1);
                    //    var query2 = doc1.update({
                    //        'status': 2,
                    //    });
                    //    query2.exec(function (err, res) {
                    //        console.log(res);
                    //    })
                        

                    //});
                    //var query1 = messagesDB.find().or([{'login1':userArr[numUserId].login},{'login2':userArr[numUserId].login}]);
                    //query1.exec(function (err, doc1) {
                    //    console.log(doc1);
                    //}
                    //);
                }
                else
                {
                     to(numUserId,JSON.stringify({ action: 'MESSAGELIST', messageArr: null }))
                }
            });
        }
        else if(jsonMessage.action=='SEARCH')
        {
            calcUserArr();
            var interval=setInterval(function () {
                if (loginArr.flag==true)
                {
                    var text = jsonMessage.data;
                    var resultArr = [];
                    for (let i = 0; i < loginArr.arr.length;i++)
                    {
                        if (loginArr.arr[i].indexOf(text) != -1)
                        {
                            resultArr.push(loginArr.arr[i]);
                        }
                    }
                    for (let i = 0; i < userArr.length;i++)
                    {
                        if (userArr[i] && userArr[i].id==i && userArr[i].raceMess==true)
                        {
                            to(userArr[i].id, JSON.stringify({ action: 'SEARCHRESULT', loginArr: resultArr }));
                        }
                        
                    }
                    clearInterval(interval);
                }
            });
        }
       // console.log(jsonMessage.data);
    });
    // при разврыве соединения
    ws.on('close', function incoming(message) {
        console.log('disconnect');
        console.log(message);
        delete userArr[userId];
        delete sockets[userId];
        //calcUserArr();
       // console.log(userArr);
    });

});
function getCountMessage(loginArr)
{
    console.log('COUNT MESSAGE');
    countMessage = [];
    countMesFlag=false
    let count = 0;
    let loginHost = '';
    var query = messagesDB.find();
    query.exec(function (err, mesArr) {
        console.log('USERS USERS');
        console.log(mesArr);
        for (let k = 0; k < loginArr.length;k++)
        {
            if (loginArr[k]!=userArr[userArr.length - 1].login)
            {
                count = 0;
                for (let i = 0; i < mesArr.length;i++)
                { 
                    if (loginArr[k]==mesArr[i].login1 || loginArr[k]==mesArr[i].login2)
                    {
                    
                        for (let j = 0; j < mesArr[i].messageArr.length;j++)
                        {
                            if (/*loginArr[k]*/userArr[userArr.length - 1].login==mesArr[i].messageArr[j].loginHost)
                            {
                   
                                if (mesArr[i].messageArr[j].status == 1)
                                {
                                    count++;            
                                    //loginHost = mesArr[i].messageArr[j].loginSender;
                                    //loginHost = loginArr[k];
                                }
                            }
                        }
                    
                    }
                    console.log(mesArr[i]); 
                }
            
            
                countMessage.push({login:loginArr[k],countMes:count});
                console.log('PUSH COUNT'); 
            }
        }
      //  console.log(countMessage);
        countMesFlag = true;
    });


}
function getContacts(login)
{
    contactFlag = false;
    contactUserArr = [];
    var query = usersDB.findOne().where({'login':login});
    
    query.exec(function (err, user) {
        if (user!=null)
        {
            for (let i = 0; i < user.contactArr.length;i++)
            {
                contactUserArr.push(user.contactArr[i].loginHost);
            }
            console.log(contactUserArr);
            contactFlag = true;
        }
    });
}
function calcUserArr(str='') // функция расчитать список пользователей
{
    let userArrLogin = [];
    loginArr.flag = false;
    //for (let i = 0; i < userArr.length;i++)
    //{
    //    if (userArr[i])    userArrLogin.push(userArr[i].login);
    //}
    var query = usersDB.find();
    query.select('login');
  //  console.log(query);
    query.exec(function (err, users) {
        console.log('USER LIST: ');
        console.log('ERR: '+err);
        for (let i = 0; i < users.length;i++)
        {
          // console.log(users[i].login)
           userArrLogin.push(users[i].login);
        }
        ;
        loginArr.arr = userArrLogin;
        loginArr.flag = true
        //for (let i = 0; i < userArr.length;i++)
        //{
        //    if (userArr[i] && userArr[i].raceMess==true)
        //    {
        //        to(i,JSON.stringify({action:'USER',loginArr:userArrLogin}));
        //        console.log('i='+i);
        //    }
        //}
    }); 
    //setTimeout(function () {
    //    if (flag==true)
    //    {

    //    }
    //}, 100);
   
}
function saveUserBd (login)
{
    var newUser = new usersDB({
        login: login,
    });
    console.log('Is Document new?' + newUser.isNew+ newUser);
    newUser.save(function (err, doc) {
        console.log("\nSaved document: " + doc + '\n' + err);
    });
}