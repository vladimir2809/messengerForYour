const WebSocket = require('ws');
const webServer = new WebSocket.Server({port:9000});
var countMes=0;
//wsServer.on('connection', onConnect);
var countUser=0;

//Вам нужно будет сделать свою собственную оболочку:

const sockets = {};
var user = {
    id:null,
    login:'',
    raceMess:false,

}
var userArr = [];
function to(user, data) {

    if(sockets[user] && sockets[user].readyState === WebSocket.OPEN)
        sockets[user].send(data);
}

webServer.on('connection', (ws) => {

    const userId = countUser;//getUserIdSomehow(ws);
    var   userOne=JSON.parse(JSON.stringify(user));;
    userOne.id = userId;
    userArr.push(userOne);
    countUser++;
    sockets[userId] = ws;
    console.log('connect');

    ws.on('message', function incoming(message) {
        // Or get user in here
        var jsonMessage = JSON.parse(message);
        if (jsonMessage.action=='LOGIN')
        {
            userArr[userArr.length - 1].login = jsonMessage.data;
            userArr[userArr.length - 1].raceMess = true;

            console.log(userArr);
            var userArrLogin = [];
            for (let i = 0; i < userArr.length;i++)
            {
                if (userArr[i].id!=userId)    userArrLogin.push(userArr[i].login);
            }
            for (let i = 0; i < userArr.length;i++)
            {
                if (userArr[i] && userArr[i].raceMess==true)
                {
                    to(i,JSON.stringify({action:'USER',loginArr:userArrLogin}));
                }
            }
            //for (let i = 0; i < userArr.length;i++)
            //{
            //    for (let j = 0; j < userArr.length;j++)
            //    {
            //        if (userArr[i] && userArr[j] && userArr[i].raceMess==true && userArr[i].id != userArr[j].id )
            //            to(userArr[i].id,JSON.stringify({action:'USER',text:userArr[j].login}));
            //    }
            
            //}

        }
        console.log(jsonMessage.data);
    });

    ws.on('close', function incoming(message) {
        console.log('disconnect');
        console.log(message);
        delete userArr[userId];
        delete sockets[userId];
        console.log(userArr);
    });

});
setInterval(function () {
    for (let i = 0; i < userArr.length;i++)
    {
        if (userArr[i] && userArr[i].raceMess==true)
            to(userArr[i].id,JSON.stringify({action:'TEXT',text:userArr[i].id+'я клиент номер: '+i+' login: '+userArr[i].login}));
            
    }
}, 1000);

//function onConnect(wsClient) {
//    console.log('Новый пользователь');
//    countUser++;
//    // отправка приветственного сообщения клиенту
//    wsClient.send('Привет hai user: '+countUser);
//    wsClient.on('message', function(message) {
//        /* обработчик сообщений от клиента */
//        try {
//            // сообщение пришло текстом, нужно конвертировать в JSON-формат
//            const jsonMessage = JSON.parse(message);
//            switch (jsonMessage.action) {
//              case 'ECHO':
//                wsClient.send(jsonMessage.data);
//                break;
//              case 'PING':
//                setTimeout(function() {
//                  wsClient.send('PONG');
//                //  console.log(JSON.stringify(wsClient));
//                }, 2000);
//                break;
//              case 'TEXT':
//                console.log(jsonMessage.data);
//                //console.log (123);
//                break;
//              default:
//                console.log('Неизвестная команда');
//                break;
//            }
//          } catch (error) {
//            console.log('Ошибка', error);
//          } 
//      setInterval(function(){
//          wsClient.send('Hello World '+countMes+' User '+countUser);
//          countMes++;
//          console.log('сообщение отпвралено');
//      },1000);
//    });
 
//    wsClient.on('close', function() {
//        // отправка уведомления в консоль
//        console.log('Пользователь отключился');
//    });
 // }