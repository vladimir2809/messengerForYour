const WebSocket = require('ws');
const webServer = new WebSocket.Server({port:9000});
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/messanger');
var usersSchema = require('./schemesForMessanger.js').usersSchema;
var usersDB = mongoose.model('Users',usersSchema);
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
            
        }else if (jsonMessage.action=='LOGIN')// пользователь вошел в систему
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
            calcUserArr();
            var userArrLogin = loginArr.arr;
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
        }

        else if(jsonMessage.action=='MESSAGE')// пришло сообшение
        {

            for (let i = 0; i < userArr.length;i++)
            {
                if (userArr[i] && userArr[i].login==jsonMessage.host)
                {
                    to(userArr[i].id,JSON.stringify({action:'TEXT',data:jsonMessage.data}))
                }
            }
        }                          //SEARCH
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