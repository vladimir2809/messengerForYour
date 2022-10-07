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
            userArr[userArr.length - 1].login = jsonMessage.login;
            userArr[userArr.length - 1].raceMess = true;
            var query = usersDB.count();
            query.where('login',jsonMessage.login);
            //  console.log(query);
            query.exec(function (err, count){
                if (count > 0) 
                {
                    to(userId, JSON.stringify({ action: 'BEUSERNAME' }))
                }
                else
                {
                    saveUserBd(jsonMessage.login);
                    to(userId, JSON.stringify({ action: 'NEWUSEROK',login:jsonMessage.login }));
                }
            });
            
        }
        if (jsonMessage.action=='LOGIN')// пользователь вошел в систему
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
            sendUser();
        }
        else if(jsonMessage.action=='MESSAGE')// пришло сообшение
        {

            for (let i = 0; i < userArr.length;i++)
            {
                if (userArr[i] && userArr[i].login==jsonMessage.host)
                {
                    to(userArr[i].id,JSON.stringify({action:'TEXT',text:jsonMessage.data}))
                }
            }
        }                          //SEARCH
        else if(jsonMessage.action=='SEARCH')
        {
            sendUser();
        }
        console.log(jsonMessage.data);
    });
    // при разврыве соединения
    ws.on('close', function incoming(message) {
        console.log('disconnect');
        console.log(message);
        delete userArr[userId];
        delete sockets[userId];
        sendUser();
        console.log(userArr);
    });

});
function sendUser(str='') // функция отправки списка пользователей
{
    var userArrLogin = [];
          
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
        for (let i = 0; i < userArr.length;i++)
        {
            if (userArr[i] && userArr[i].raceMess==true)
            {
                to(i,JSON.stringify({action:'USER',loginArr:userArrLogin}));
                console.log('i='+i);
            }
        }
    });
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