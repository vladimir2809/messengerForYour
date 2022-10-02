const myWs = new WebSocket('ws://localhost:9000');

window.onload = function () {
    var button = document.getElementById('button');
    button.onclick=function(){
        var textarea = document.getElementById('textarea');
     
        var text = textarea.value; // "Некоторый текст" 
        updateChat(text,0);      
    //    // alert(text);
    //     var elem=createElem(text);
    //     insertElem(elem);

        wsSendText(text);

    }
    var buttonLogin = document.getElementById('submit');
    buttonLogin.onclick = function () {
        var divChat=document.getElementById('divChat');
        divChat.style.display = 'block';
        var divReg=document.getElementById('divRegistration');
        divReg.style.display = 'none';
        var login=document.getElementById('login').value;
        wsSendLogin(login);
        
    }
    //setInterval(function () {
    //    addUser('efrika');
    //}, 1000);
    //myWs = new WebSocket('ws://localhost:9000');
    // обработчик проинформирует в консоль когда соединение установится
    myWs.onopen = function () {
        console.log('подключился');
    };
    // обработчик сообщений от сервера
    myWs.onmessage = function (message) {
       // console.log('Message: %s', message.data);
        console.log(message.data);
        var jsonMessage = JSON.parse(message.data);
        switch (jsonMessage.action)
        {
            case 'TEXT': updateChat(jsonMessage.text, 1); break;
            case 'USER':
                {
                    var element = document.getElementById("divUserList");
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    //    addUser(jsonMessage.text); break;
                }
                for (let i = 0; i < jsonMessage.loginArr.length;i++)
                {
                    addUser(jsonMessage.loginArr[i]); 
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
    function wsSendLogin(value) {
        myWs.send(JSON.stringify({action: 'LOGIN', data: value.toString()}));
    }
    // функция для отправки команды ping на сервер
    function wsSendPing() {
        myWs.send(JSON.stringify({action: 'PING'}));
    }
}
function createElem(text,receive=0,className='')
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
function insertElem(elem,className='')
{
    if (className == '') className = 'message-box';
    var divBox=document.getElementById(className);
    divBox.append(elem);
}
function updateChat(text,receive)
{
    //var text = textarea.value; // "Некоторый текст"       
    // alert(text);
    var elem=createElem(text,receive);
    insertElem(elem);
    //wsSendText(text);
}
function addUser(text)
{
    var elem = createElem(text, 0, 'divUser');
    insertElem(elem, 'divUserList');
}