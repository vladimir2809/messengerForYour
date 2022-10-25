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

}
loginArr = {
    arr:[],
    flag: false,
}
var userArr = [];
var contactArr = [];
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
    userArr.push(userOne);
    countUser++;
    sockets[userId] = ws;
    console.log('connect');

    ws.on('message', function incoming(message) {
        // Or get user in here
        var jsonMessage = JSON.parse(message);// распарским сообшение от клиентов
        if (jsonMessage.action=='REGISTRATION')// пользователь зарегался
        {
            userArr[userArr.length - 1].login = jsonMessage.data;
            userArr[userArr.length - 1].raceMess = true;
            var query = usersDB.count();
            query.where('login',jsonMessage.data);
            //  console.log(query);
            query.exec(function (err, count){
                if (count > 0) 
                {
                    to(userId, JSON.stringify({ action: 'BEUSERNAME' }))
                }
                else
                {
                    saveUserBd(jsonMessage.data);
                    to(userId, JSON.stringify({ action: 'NEWUSEROK',data:jsonMessage.data }));
                }
            });
            
        }
        else if (jsonMessage.action=='LOGIN')// пользователь вошел в систему
        {
            userArr[userArr.length - 1].login = jsonMessage.data;
            userArr[userArr.length - 1].raceMess = true;

            console.log(userArr);
            //saveUserBd(jsonMessage.data);
            //var newUser = new usersDB({
            //    login: jsonMessage.data,
            //});
            //console.log('Is Document new?' + newUser.isNew+ newUser);
            //newUser.save(function (err, doc) {
            //    console.log("\nSaved document: " + doc + '\n' + err);
            //}); 
           // calcUserArr();
            getContacts(userArr[userArr.length - 1].login);
            var interval = setInterval(function () {
                if (contactFlag==true)
                {
                    //var userArrLogin = loginArr.arr;
                    var userArrLogin = contactArr;
                    console.log('USERARRLOGIN: '+userArrLogin);
                    for (let i = 0; i < userArr.length;i++)
                    {
                        if (userArr[i] && userArr[i].id==i && userArr[i].raceMess==true)
                        {
                            to(i,JSON.stringify({action:'USER',loginArr:userArrLogin}));
                            console.log('i='+i);
                        }
                    //}

                    }
                    clearInterval(interval);
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
                    var query=doc1.updateOne({$push:{ 
                        messageArr: { "loginSender": jsonMessage.sender,"message":jsonMessage.data }
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
                        messageArr: [{ loginSender: jsonMessage.sender, message: jsonMessage.data }],
                    });
                    console.log('NEW MESSAGE');
                    newMessage.save(function (err, doc) {
                        console.log("\nSaved document of message: " + doc + '\n' + err);

                        var queryUser = usersDB.findOne().where({ login: jsonMessage.sender }); 
                        queryUser.exec(function (err, user){
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

                    });
                    
                }
            });
        }
        else if(jsonMessage.action=='GETMESSAGELIST')
        {
             var query = messagesDB.findOne().or([
                {$and: [{'login1': jsonMessage.sender}, {'login2': jsonMessage.host} ]},
                {$and: [{'login2': jsonMessage.sender}, {'login1': jsonMessage.host }]},
            ]);
            query.exec(function (err, doc) {
                console.log('MESSAGELIST');
                console.log(doc);
                if (doc!=null)
                {
                    to(userId,JSON.stringify({ action: 'MESSAGELIST', messageArr: doc.messageArr }))
                }
                else
                {
                     to(userId,JSON.stringify({ action: 'MESSAGELIST', messageArr: null }))
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
        console.log(jsonMessage.data);
    });
    // при разврыве соединения
    ws.on('close', function incoming(message) {
        console.log('disconnect');
        console.log(message);
        delete userArr[userId];
        delete sockets[userId];
        //calcUserArr();
        console.log(userArr);
    });

});
function getContacts(login)
{
    contactFlag = false;
    contactArr = [];
    var query = usersDB.findOne().where({'login':login});
    
    query.exec(function (err, user) {
        if (user!=null)
        {
            for (let i = 0; i < user.contactArr.length;i++)
            {
                contactArr.push(user.contactArr[i].loginHost);
            }
            console.log(contactArr);
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
           console.log(users[i].login)
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