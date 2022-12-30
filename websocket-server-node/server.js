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
var pingObj = {
    login:null,
    lastTime:0,
    onlineStatus:false,
}
var contactUserArr = [];
var countMessage = [];
var countMesFlag=false;
var pingArr = [];
var countMesTrigerFlag = false;
var contactFlag = false;
// функция отправки сообщения конкретному сокету
function to(user, data) {

    if(sockets[user] && sockets[user].readyState === WebSocket.OPEN)
        sockets[user].send(data);
}
// сооединение с бд
mongoose.connection.on('open', function () {
    console.log('mongoose open');
});
//соединение
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
    // пришло сообшение на сервер
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
                    saveUserBd(jsonMessage.data,jsonMessage.password);
                    to(userId, JSON.stringify({ action: 'NEWUSEROK', data: jsonMessage.data }));
                }
            });

        }
        else if (jsonMessage.action == 'LOGIN')// пользователь входит в систему
        {
            userArr[userArr.length - 1].login = jsonMessage.data;
            userArr[userArr.length - 1].raceMess = true;
            let login = userArr[userArr.length - 1].login;
            let flagDoubleLogin = false;
            //for (let i = 0; i < userArr.length-1;i++)
            //{
            //    var numLength = userArr.length - 1;
            //    if (userArr[numLength] && userArr[i] && userArr[i].login==userArr[numLength].login 
            //        && userArr[numLength].raceMess==true)
            //    {                                                  
            //        to(numLength,JSON.stringify({action:'DOUBLELOGIN',data:null}));
            //        console.log('i='+i);
            //        flagDoubleLogin = true;
            //    }
            //}
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
                                if (res.password==jsonMessage.password)
                                {
                                    to(i,JSON.stringify({action:'YESLOGIN',data:null}));
                                    console.log('YESLOGIN');
                                    console.log(res);
                                    console.log(jsonMessage);
                                }
                                else
                                {
                                    to(i,JSON.stringify({action:'NOLOGIN',data:null}));
                                }
                            }
                            //if (userArr[i] && userArr[i].login==jsonMessage.data && userArr[i].raceMess==true)
                            //{
                            //    to(i,JSON.stringify({action:'YESLOGIN',data:null}));
                            //    console.log('i='+i);
                            //}
                        }
                    }
                });
            }
            
            // отрпавка списка пользователей и количества не прочитанных сообщений
            getContacts(userArr[userArr.length - 1].login);// получить список контактов
            var interval = setInterval(function () {
                if (contactFlag==true )// если список контактов получен
                {
                    //var userArrLogin = loginArr.arr;
                    var userArrLogin = contactUserArr;
                    console.log('USERARRLOGIN: '+userArrLogin);
                    if (countMesTrigerFlag==false)
                    {
                        getCountMessage(userArrLogin);// получить список количества не прочитанных сообшений
                        countMesTrigerFlag = true;
                    }
                    if (countMesFlag==true)// если список не прочитанных сообшений получен
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
                        // сохраним новый контакт у получателя
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
            // отправка пользовательских сообшений
            for (let i = 0; i < userArr.length;i++)
            {
                if (userArr[i] && userArr[i].login==jsonMessage.host && userArr[i].raceMess==true)
                {
                    to(i,JSON.stringify({ action: 'TEXT', sender:jsonMessage.sender ,data: jsonMessage.data}))
                }
            }
        }
        else if(jsonMessage.action=='GETMESSAGELIST')// пришел запрос получить список сообшений
        {
            //запрос в бд на поиск конкретной ветки сообшений
             var query = messagesDB.findOne().or([
                {$and: [{'login1': jsonMessage.sender}, {'login2': jsonMessage.host} ]},
                {$and: [{'login2': jsonMessage.sender}, {'login1': jsonMessage.host }]},
            ]);
            query.exec(function (err, doc) {
                let numUserId = null;
                // расчитаваем ид сокета отправителя 
                for (let i = 0; i < userArr.length;i++)
                {
                    if (userArr[i] && userArr[i].login==jsonMessage.sender && userArr[i].raceMess==true)
                    {
                        numUserId = i;
                        break;
                    }
                }
                if (doc!=null)// если есть результа запроса от бд
                {
                    
                    console.log(doc);
                    // присваеваем сообшениям которые отправятся в списке статус 2 (прочитано)
                    for (let i = 0; i < doc.messageArr.length;i++)
                    {
                        if (doc.messageArr[i].loginHost==userArr[numUserId].login)
                        {
                            doc.messageArr[i].status = 2;
                        }
                    }
                    // сохраняем елемент коллекции в бд
                    doc.save(function (err, res) {
                        console.log('status change');
                    });
                    // отправляем список сообшений
                    for (let i = 0; i < userArr.length;i++)
                    {
                        if (userArr[i] && userArr[i].login==jsonMessage.sender && userArr[i].raceMess==true)
                        {
                            to(i, JSON.stringify({ action: 'MESSAGELIST', messageArr: doc.messageArr,countMessage:countMessage }));
                        }
                    }
           
                   
                }
                else
                {
                    for (let i = 0; i < userArr.length;i++)
                    {
                        if (userArr[i] && userArr[i].login==jsonMessage.sender && userArr[i].raceMess==true)
                        {
                            to(i,JSON.stringify({ action: 'MESSAGELIST', messageArr: null }))
                        }
                    }
                }
            });
        }
        else if(jsonMessage.action=='SEARCH')/// присшел запрос на поиск пользователей
        {
            calcUserArr();// расчитать список всех пользователей
            var interval=setInterval(function () {
                if (loginArr.flag==true)// если список пользолвателей расчитан
                {
                    var text = jsonMessage.data;
                    var resultArr = [];
                    // поиск совпадений
                    for (let i = 0; i < loginArr.arr.length;i++)
                    {
                        if (loginArr.arr[i].indexOf(text) != -1 && jsonMessage.login != loginArr.arr[i] )
                        {
                            resultArr.push(loginArr.arr[i]);
                        }
                    }
                    // отправка результа поиска
                    for (let i = 0; i < userArr.length;i++)
                    {
                        if (userArr[i] && userArr[i].login==jsonMessage.login && userArr[i].raceMess==true)
                        {
                            to(userArr[i].id, JSON.stringify({ action: 'SEARCHRESULT', loginArr: resultArr }));
                        }
                        
                    }
                    clearInterval(interval);
                }
            });
        }
        else if (jsonMessage.action=="PING")
        {
           // console.log('Ping '+jsonMessage.user);
            let flag = false;
            let time = new Date().getTime();
            for (let i = 0; i < pingArr.length;i++)
            {
                if (jsonMessage.user==pingArr[i].login)
                {
                    pingArr[i].lastTime = time;
                    pingArr[i].onlineStatus = true;  
                    flag = true;
                }
            }
            if (flag==false)
            {
                pingArr.push({login:jsonMessage.user,lastTime:time,onlineStatus:true});
            }
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
setInterval(function () {
    let time=new Date().getTime();
    for (let i = 0;i < pingArr.length;i++)
    {
        if (time>pingArr[i].lastTime+2000)
        {
            pingArr[i].onlineStatus = false;  
        }
    }
    let userListOnline = [];
    for (let i = 0; i < pingArr.length;i++)
    {
        if (pingArr[i].onlineStatus==true)
        {
            userListOnline.push(pingArr[i].login);
        }
    }
    console.log(userListOnline);
    for (let i = 0; i < userArr.length;i++)
    {
        if (userArr[i] && userArr[i].id==i && userArr[i].raceMess==true)
        {
            to(userArr[i].id, JSON.stringify({ action: 'LISTUSERONLINE', userList: userListOnline }));
        }
                        
    }
},500);
function getCountMessage(loginArr)// получить список количества не прочитанных сообщений
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
function getContacts(login)// получить спиоск контактов
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
    var query = usersDB.find();
    query.select('login');
    query.exec(function (err, users) {
        console.log('USER LIST: ');
        console.log('ERR: '+err);
        for (let i = 0; i < users.length;i++)
        {
           userArrLogin.push(users[i].login);
        }
        ;
        loginArr.arr = userArrLogin;
        loginArr.flag = true
    });
   
}
function saveUserBd (login,password)// сохранить пользователя в бж
{
    var newUser = new usersDB({
        login: login,
        password: password,
    });
    console.log('Is Document new?' + newUser.isNew+ newUser);
    newUser.save(function (err, doc) {
        console.log("\nSaved document: " + doc + '\n' + err);
    });
}