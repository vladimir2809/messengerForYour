const myWs = new WebSocket('ws://localhost:9000');
var userListName = [];// масси вимен пользователей
var numSelectHost = null;
var selectHost = ''; // выбранный пользователь для отпраавки сообшений
 var labelReg=null;
 var labelIn=null;
var myLogin = null;
window.onload = function () {
    labelReg=document.getElementById('labelRegP');
    labelIn=document.getElementById('labelInP');
    // отправлеям сообшение
    updateChat('dct good',1);
    var button = document.getElementById('button');
    button.onclick=function(){
        sendMessage();
        //var textarea = document.getElementById('textarea');
     
        //var text = textarea.value;  
        //updateChat(text,0);      
        //wsSendText(text);
        //wsSendMessage('', selectHost, text); 

    }
    document.addEventListener('keydown', function(event) {
        if (event.code == 'Enter' && (event.ctrlKey || event.metaKey) ) 
        {
            if (document.querySelector(':focus').tagName && 
                 document.querySelector(':focus').tagName=='TEXTAREA')
            {
                sendMessage();        
            }
        }
    });
    // кнопка зарегистрироваться
    var buttonBeginReg = document.getElementById('submitBeginReg');
    buttonBeginReg.onclick = function () {
        var divReg=document.getElementById('divRegistration');
        divReg.style.display = 'block';
        var divAutch=document.getElementById('divAutorization');
        divAutch.style.display = 'none';
    }
    // регистрация
    var buttonReg = document.getElementById('submitReg');
    buttonReg.onclick = function () {
        var login = document.getElementById('loginReg').value;    
        var name = document.getElementById('nameReg').value;
        var surname = document.getElementById('surnameReg').value;
        var password = document.getElementById('passwordReg').value;
        var password2=document.getElementById('password2Reg').value;
        if  (login=='')
        {
            labelReg.innerHTML = "Введите логин";
        }
        //else  if  (name=='')
        //{
        //    labelReg.innerHTML = "Введите имя";
        //}
        //else  if  (surname=='')
        //{
        //    labelReg.innerHTML = "Введите Фамилию";
        //}
        //else  if  (password=='')
        //{
        //    labelReg.innerHTML = "Введите пароль";
        //}
        //else if (password!=password2)
        //{
            
        //    labelReg.innerHTML = "Пароли не совпадают.";
        //} 
        else
        {
            wsSendRegistration(login); 
            //alert('регистрация');
        }
       // console.log(password);
    }
    // вход в систему
    var buttonLogin = document.getElementById('submit');
    buttonLogin.onclick = function () {
        myLogin=document.getElementById('login').value;
       // inSystemMessanger(myLogin);
    
        wsSendLogin(myLogin);
       

        
    }
    var buttonSearch = document.getElementById('buttonSearch');
    buttonSearch.onclick=function () {
        var textSearch=document.getElementById('textAreaSearch').value;
      //wsSendSearch
        wsSendSearch(textSearch);
    //    alert(textSearch);
    };
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
            case 'TEXT': // пришло сообшение
                {
                    if (jsonMessage.sender==selectHost)
                    {
                        updateChat(jsonMessage.data, 1);
                    }
                    else
                    {
                        updateCountMessage(jsonMessage.sender, 1);
                        //document.querySelectorAll('.divUser').forEach(function (elem) {
                        //    let text = elem.firstChild.innerHTML;
                        //    let textRes=text.replace(/<span(.*?)<\/span>/g, '');
                        //    //alert(textRes);
                        //    if (textRes==jsonMessage.sender)
                        //    {
                        //        //elem.firstChild.innerHTML = text;  
                        //        //let text2 = elem.lastChild.innerHTML;
                        //        elem.firstChild.lastChild.innerHTML = '+1';
 
                        //    }
                      
                        //});
                    }
                }break;
            case 'USERS':// пришел список пользователей
                {
                    updateUserList(jsonMessage.loginArr);
                    for (let i = 0; i<jsonMessage.loginArr.length; i++)
                    {
                        if (jsonMessage.loginArr[i]==jsonMessage.countMessage[i].login)
                        {
                            updateCountMessage(jsonMessage.loginArr[i], jsonMessage.countMessage[i].countMes);
                        }
                    }
                    console.log(jsonMessage.countMessage);
                }
                break;
             case 'YESLOGIN':// пришел список пользователей
                {
                    
                
                    inSystemMessanger(myLogin);
                }
                break;
             case 'NOLOGIN':// пришел список пользователей
                {
                    labelIn.innerHTML= 'Нет такого логина';
                   
                   // inSystemMessanger(myLogin);
                }
                break;
            case 'DOUBLELOGIN':// пришел список пользователей
                {
                   labelIn.innerHTML= 'Пользователь уже в системе';
                   
                }
                break;
            case 'BEUSERNAME': 
                {
                    labelReg.innerHTML = 'Уже есть такой логин'; 
                    alert ('REG')
                }
                break;// пришло сообшение о том что этот пользователь есть в системе
             case 'NEWUSEROK': 
                {
                    //wsSendLogin(jsonMessage.login);
                    inSystemMessanger(jsonMessage.data);
                }
                break;
             case 'MESSAGELIST': 
                {
                    //wsSendLogin(jsonMessage.login);
                  //  inSystemMessanger(jsonMessage.data);
                    clearChat();
                    if (jsonMessage.messageArr!=null)
                    {
                        for (let i = 0; i < jsonMessage.messageArr.length;i++)
                        {
                            console.log(jsonMessage.messageArr[i].message);
                            console.log(jsonMessage.messageArr[i].loginSender);
                            var receive = jsonMessage.messageArr[i].loginSender == myLogin ? 1 : 0;
                            updateChat(jsonMessage.messageArr[i].message, receive);
                        }
                        let messageBox = document.getElementById('message-box');    
                        let height =     document.getElementById("message-box").scrollHeight;
                        messageBox.scrollTo(0,height);
                    }

                }
               break;
             case 'SEARCHRESULT' :
                {
                    updateUserList(jsonMessage.loginArr);
                    //wsSendLogin(jsonMessage.login);
                   // inSystemMessanger(jsonMessage.data);
                    //var element = document.getElementById("divUserList");
                    //while (element.firstChild) 
                    //{
                    //    element.removeChild(element.firstChild);
                    //}
                    //for (let i = 0; i < jsonMessage.data.length; i++) 
                    //{
                    //    addUser(jsonMessage.data[i]);
                    //    //alert(1);
                    //}
                }
                break;
            
        }
        console.log(jsonMessage);
    };

}
function updateCountMessage(login,value)
{
    document.querySelectorAll('.divUser').forEach(function (elem) {
        let text = elem.firstChild.innerHTML;
        let textRes=text.replace(/<span(.*?)<\/span>/g, '');
        //alert(textRes);
        if (textRes==login)
        {
            //elem.firstChild.innerHTML = text;  
            //let text2 = elem.lastChild.innerHTML;
            elem.firstChild.lastChild.innerHTML = '+'+value;
 
        }
                      
    });
}
function updateUserList(listUser)
{
    var element = document.getElementById("divUserList");
    while (element.firstChild) 
    {
        element.removeChild(element.firstChild);
    }
    userListName = [];

    for (let i = 0; i < listUser.length; i++) 
    {
        addUser(listUser[i]);
        //alert(1);
    }
}
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
function wsSendMessageList(sender,host) {
    myWs.send(JSON.stringify({action: 'GETMESSAGELIST',sender:sender,host:host }));
}
function wsSendLogin(value) {
    myWs.send(JSON.stringify({action: 'LOGIN', data: value.toString()}));
}
function wsSendRegistration(login) {
    myWs.send(JSON.stringify({action: 'REGISTRATION', data: login.toString()}));
}
function wsSendSearch(str) {
    myWs.send(JSON.stringify({action: 'SEARCH', data: str.toString()}));
}
// функция для отправки команды ping на сервер
function wsSendPing() {
    myWs.send(JSON.stringify({action: 'PING'}));
}
// постоянный цикл 
setInterval(function () {

    let arr = document.querySelectorAll('.divUser');//;.forEach(function (elem){
   // console.log(arr);
    for (let i = 0; i < arr.length;i++)
    {
        //if ('<p>'+selectHost+'</p>' == elem.innerHTML)
        if (numSelectHost==i)
        {
            arr[i].style.backgroundColor = 'rgb(255,128,0)';
        }
        else
        {
            arr[i].style.backgroundColor = 'rgb(0,255,0)';
        }
    }
            
       
   // });
  //  console.log(document.querySelector(':focus').tagName);

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
function createUserDiv(text,countMes)
{
    let div = document.createElement('div');
    div.className = 'divUser';
    div.innerHTML="<p>"+text+"<span>"+(countMes==0?'':('+'+countMes))+"</span>"+"</p>";
    return div;
}
function insertElem(elem,className='')// вставить элемент
{
    if (className == '') className = 'message-box';
    var divBox=document.getElementById(className);
    divBox.append(elem);
  
}
function clearChat()
{
    var element = document.getElementById("message-box");
    while (element.firstChild) 
    {
        element.removeChild(element.firstChild);
    }
}
function updateChat(text,receive)
{
    var elem=createElem(text,receive);
    insertElem(elem);
}
function addUser(text,countMes=0)// добавить пользователя
{
    //var elem = createElem(text, 0, 'divUser');
    var elem=createUserDiv(text,countMes)
    userListName.push(text);
    elem.id = text;
    insertElem(elem, 'divUserList');

  //  document.querySelectorAll('.divUser').forEach(function (elem){
        //elem.addEventListener('click', function () { 
        elem.onclick= function () { 
            selectHost = elem.id;
            for (let i = 0; i < userListName.length;i++)
            {
                if (userListName[i] == selectHost) numSelectHost = i;
            }
            var divRaceName = document.querySelector('#divRaceName p');
            divRaceName.innerHTML = selectHost;
            wsSendMessageList(myLogin,selectHost) 
            console.log('выбран пользователь '+selectHost);
         };
  //  });
}
function strip_tags(originalString)
{
    const strippedString = originalString.replace(/(<([^>]+)>)/gi, "");
    console.log(strippedString);
    return strippedString;
}
function sendMessage()
{
    var textarea = document.getElementById('textarea');
     
    var text = textarea.value; 
    textarea.value= '';  
    updateChat(text,0);      
    wsSendText(text);
    wsSendMessage(myLogin, selectHost, text);
   

}
function inSystemMessanger(login='')
{
   var divMain=document.getElementById('divMain');
    divMain.style.display = 'block';
    var divAutch=document.getElementById('divAutorization');
    divAutch.style.display = 'none';
 //   var login=document.getElementById('login').value;
    var divImName = document.querySelector('#divImName p');
    var divRegistration=document.getElementById('divRegistration');
    divRegistration.style.display = 'none';
    divImName.innerHTML = login;
  
}