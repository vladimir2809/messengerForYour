const myWs = new WebSocket('ws://localhost:9000');
var userListName = [];// масси вимен пользователей
var selectHost = ''; // выбранный пользователь для отпраавки сообшений
 var labelReg=null;
window.onload = function () {
    labelReg=document.getElementById('labelRegP');
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
        var login=document.getElementById('login').value;
        inSystemMessanger(login);
    
        wsSendLogin(login);
       

        
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
            case 'TEXT': updateChat(jsonMessage.data, 1); break;// пришло сообшение
            case 'USER':// пришел список пользователей
                {
                    updateUserList(jsonMessage.loginArr);
                   
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
            var divRaceName = document.querySelector('#divRaceName p');
            divRaceName.innerHTML = selectHost;
            console.log('выбран пользователь '+selectHost);
        });
    });
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
    wsSendMessage('', selectHost, text);
   

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