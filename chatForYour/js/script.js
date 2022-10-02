const myWs = new WebSocket('ws://localhost:9000');
var userListName = [];// масси вимен пользователей
var selectHost = ''; // выбранный пользователь для отпраавки сообшений
window.onload = function () {
    // отправлеям сообшение
    var button = document.getElementById('button');
    button.onclick=function(){
        var textarea = document.getElementById('textarea');
     
        var text = textarea.value;  
        updateChat(text,0);      
        wsSendText(text);
        wsSendMessage('', selectHost, text); 

    }
    // вход в систему
    var buttonLogin = document.getElementById('submit');
    buttonLogin.onclick = function () {
        var divChat=document.getElementById('divChat');
        divChat.style.display = 'block';
        var divReg=document.getElementById('divRegistration');
        divReg.style.display = 'none';
        var login=document.getElementById('login').value;
        wsSendLogin(login);

        
    }
    // обработчик проинформирует в консоль когда соединение установится
    myWs.onopen = function () {
        console.log('подключился');
    };
    // обработчик сообщений от сервера
    myWs.onmessage = function (message) {
        console.log(message.data);
        var jsonMessage = JSON.parse(message.data);
        switch (jsonMessage.action)
        {
            case 'TEXT': updateChat(jsonMessage.text, 1); break;// пришло сообшение
            case 'USER':// пришел список пользователей
                {
                    var element = document.getElementById("divUserList");
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    userListName = [];

                    for (let i = 0; i < jsonMessage.loginArr.length; i++) {
                        addUser(jsonMessage.loginArr[i]);

                    }
                   
                }
            break;
        }
    };
    // функция для отправки echo-сообщений на сервер
    function wsSendEcho(value) {
        myWs.send(JSON.stringify({action: 'ECHO', data: value.toString()}));
    }
    function wsSendText(value) {
        myWs.send(JSON.stringify({action: 'TEXT', data: value.toString()}));
    }
    function wsSendMessage(sender,host,value) {
        myWs.send(JSON.stringify({action: 'MESSAGE',sender:sender,host:host ,data: value.toString()}));
    }
    function wsSendLogin(value) {
        myWs.send(JSON.stringify({action: 'LOGIN', data: value.toString()}));
    }
    // функция для отправки команды ping на сервер
    function wsSendPing() {
        myWs.send(JSON.stringify({action: 'PING'}));
    }
}
// постоянный цикл 
setInterval(function () {
    document.querySelectorAll('.divUser').forEach(function (elem){

            if ('<p>'+selectHost+'</p>' == elem.innerHTML)
            {
                elem.style.backgroundColor = 'rgb(255,128,0)';
            }
            else
            {
                elem.style.backgroundColor = 'rgb(0,255,0)';
            }
        
       
    });
},100);
function createElem(text,receive=0,className='')// создать елемент
{
    let div = document.createElement('div');
                  //"message-one accepted"
    if (className=='')
    {
        div.className = receive==0?"message-one accepted":"message-one sent";
    }
    else
    {
        div.className=className


    }
    div.innerHTML = "<p>"+text+"</p>";
    return div;
}
function insertElem(elem,className='')// вставить элемент
{
    if (className == '') className = 'message-box';
    var divBox=document.getElementById(className);
    divBox.append(elem);
}
function updateChat(text,receive)
{
    var elem=createElem(text,receive);
    insertElem(elem);
}
function addUser(text)// добавить пользователя
{
    var elem = createElem(text, 0, 'divUser');
    userListName.push(text);
    elem.id = text;
    insertElem(elem, 'divUserList');
    document.querySelectorAll('.divUser').forEach(function (elem){
        elem.addEventListener('click', function () { 
            selectHost = elem.id;
            console.log('выбран пользователь '+selectHost);
        });
    });
}