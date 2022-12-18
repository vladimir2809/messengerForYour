const myWs = new WebSocket('ws://localhost:9000');
var userListName = [];// масси вимен пользователей\
var countListMes = [];
var userOnlineArr = [];
var numSelectHost = null;
var selectHost = ''; // выбранный пользователь для отпраавки сообшений
 var labelReg=null;
 var labelIn=null;
var myLogin = null;
window.onload = function () {
    labelReg=document.getElementById('labelRegP');
    labelIn=document.getElementById('labelInP');
    // отправлеям сообшение
    //updateChat('dct good',1);
    var button = document.getElementById('button');
    button.onclick=function(){
        sendMessage(); 
    }
    document.addEventListener('keydown', function(event) {
        if (event.code == 'Enter' && (event.ctrlKey || event.metaKey) ) // отправка сообшения ентер + cntr
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
        //var name = document.getElementById('nameReg').value;
        //var surname = document.getElementById('surnameReg').value;
        var password = document.getElementById('passwordReg').value;
        var password2=document.getElementById('password2Reg').value;
        if  (login=='')
        {
            labelReg.innerHTML = "Введите логин";
        }
        if  (login.length<3)
        {
            labelReg.innerHTML = "Логин: минимум 3 символа";
        }
        //else  if  (name=='')
        //{
        //    labelReg.innerHTML = "Введите имя";
        //}
        //else  if  (surname=='')
        //{
        //    labelReg.innerHTML = "Введите Фамилию";
        //}
        else  if  (password=='')
        {
            labelReg.innerHTML = "Введите пароль";
        }
        else if (password!=password2)
        {
            
            labelReg.innerHTML = "Пароли не совпадают.";
        } 
        else
        {
            myLogin = login;
            let passwordMD5 = MD5(password);
            wsSendRegistration(login,passwordMD5); 
            //alert('регистрация');
        }
       // console.log(password);
    }
    // вход в систему
    var buttonLogin = document.getElementById('submit');
    buttonLogin.onclick = function () {
        myLogin=document.getElementById('login').value;
        password=document.getElementById('password').value;
       // inSystemMessanger(myLogin);
        let passwordMD5 = MD5(password);
        wsSendLogin(myLogin,passwordMD5);
       

        
    }
    // поиск
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
                        updateChat(jsonMessage.data, 0);
                    }
                    else
                    {
                     //   updateUserList(jsonMessage.loginArr);
                        let flag = false;
                        for (let i = 0; i < userListName.length;i++)
                        {
                            if (userListName[i]==jsonMessage.sender)
                            {
                                flag = true;
                            }
                        }
                        if (flag==false)
                        {
                            addUser(jsonMessage.sender);
                        }
                        let index = -1;
                        //console.log(countListMes);
                        //alert(countListMes);
                        for (let i = 0; i < countListMes.length;i++)
                        {
                            if (jsonMessage.sender==countListMes[i].login)
                            {
                                index = i;
                                break;
                            }
                        }
                         
                        updateCountMessage(jsonMessage.sender,(index!=-1?countListMes[index].value+1 : 1));
                        
                    }
                }break;
            case 'USERS':// пришел список пользователей
                {
                    updateUserList(jsonMessage.loginArr);
                    console.log(jsonMessage.countMessage);
                    for (let i = 0; i<jsonMessage.loginArr.length; i++)
                    {
                        for (let j = 0; j<jsonMessage.countMessage.length; j++)
                        {
                            if (jsonMessage.loginArr[i]==jsonMessage.countMessage[j].login &&
                               jsonMessage.countMessage[j].countMes>0 )
                            {
                                updateCountMessage(jsonMessage.loginArr[i], jsonMessage.countMessage[j].countMes);
                            }
                        }
                    }
                   
                }
                break;
             case 'YESLOGIN':// вход в систему
                {
                    
                
                    inSystemMessanger(myLogin);
                }
                break;
             case 'NOLOGIN':// нет такого логина 
                {
                    labelIn.innerHTML= 'Логин или пароль не верен';
                   
                   // inSystemMessanger(myLogin);
                }
                break;
            case 'DOUBLELOGIN':// логин уже в системе
                {
                   labelIn.innerHTML= 'Пользователь уже в системе';
                   
                }
                break;
            case 'BEUSERNAME': // логин повторяется
                {
                    labelReg.innerHTML = 'Уже есть такой логин'; 
                    alert ('REG')
                }
                break;
             case 'NEWUSEROK': // пользователь успешно зарегистрировался
                {
                    //wsSendLogin(jsonMessage.login);
                    inSystemMessanger(jsonMessage.data);
                }
                break;
             case 'MESSAGELIST': // пришел список сообшений
                {
                    clearChat();
                    let countStatusMes = 0;// количество не прочитанных сообшений
                    if (jsonMessage.messageArr!=null)
                    {
                        for (let i = 0; i < jsonMessage.messageArr.length;i++)
                        {
                            console.log(jsonMessage.messageArr[i].message);
                            console.log(jsonMessage.messageArr[i].loginSender);
                            var receive = jsonMessage.messageArr[i].loginSender == myLogin ? 1 : 0;
                            if (jsonMessage.messageArr[i].status==1)
                            {
                                countStatusMes++;
                            }
                            updateChat(jsonMessage.messageArr[i].message, receive);
                        }
                        updateCountMessage(selectHost, countStatusMes);// обновить счетчик-метку непрочитанных сообшений
                        let messageBox = document.getElementById('message-box');    
                        let height =     document.getElementById("message-box").scrollHeight;
                        messageBox.scrollTo(0,height);
                        
                        
                    }

                }
               break;
             case 'SEARCHRESULT' :// пришел результат поиска
                {
                    updateUserList(jsonMessage.loginArr);
                }
                break;
              case 'LISTUSERONLINE' :// пришел список пользователей онлайн
                {
                    userOnlineArr = [];
                    for (let i = 0; i < jsonMessage.userList.length;i++)
                    {
                        userOnlineArr.push(jsonMessage.userList[i]);
                    }
                    console.log("USERS ONLINE");
                    console.log(userOnlineArr);
                }
                break;
            
        }
        console.log(jsonMessage);
    };

}
function updateCountMessage(login,value)// функция обновления метки-счетчика не прочитанных сообщений
{
    let flag = false; 
    for (let i = 0; i < countListMes.length;i++)
    {
        if (countListMes[i].login==login)
        {
            countListMes[i]={ login: login, value, value };
            flag = true;
        }
    }
    if (flag==false)
    {
        countListMes.push({ login: login, value, value });
    }
    document.querySelectorAll('.divUser').forEach(function (elem) {
        let text = elem.firstChild.innerHTML;
        let textRes=text.replace(/<span(.*?)<\/span>/g, '');
        //alert(textRes);
        if (textRes==login)
        {
            //elem.firstChild.innerHTML = text;  
            //let text2 = elem.lastChild.innerHTML;
            elem.firstChild.lastChild.innerHTML = value > 0 ? '+' + value : '';
 
        }
                      
    });
}
function updateUserList(listUser)// функция обновления списка контактов
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
function wsSendLogin(value,password) {
    myWs.send(JSON.stringify({action: 'LOGIN', data: value.toString(),password:password.toString(),}));
}
function wsSendRegistration(login,password) {
    myWs.send(JSON.stringify({action: 'REGISTRATION', data: login.toString(), password:password.toString(),}));
}
function wsSendSearch(str) {
    myWs.send(JSON.stringify({action: 'SEARCH', data: str.toString(), login:myLogin}));
}
// функция для отправки команды ping на сервер
function wsSendPing(login) {
    myWs.send(JSON.stringify({action: 'PING',user:login}));
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
            arr[i].style.backgroundColor = 'rgb(100,255,100)';
        }
        let flag = false;
        for (let j = 0; j < userOnlineArr.length;j++)
        {
            if (userListName[i]==userOnlineArr[j])
            //if (1==1)
            {
               // arr[i].style.backgroundColor = 'rgb(150,150,255)';
                arr[i].lastChild.innerHTML = 'online';
                flag = true;
            }
            
          
        } 
        if (flag==false)
        {
                 arr[i].lastChild.innerHTML = '';
        }

    }
            
       
   // });
  //  console.log(document.querySelector(':focus').tagName);

},100);

setInterval(function () {
    if (myLogin!=null)
    {
        wsSendPing(myLogin);
    }
},1000);

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
function createUserDiv(text,countMes)// создать метку для счетчика сообшений
{
    let div = document.createElement('div');
    div.className = 'divUser';
    div.innerHTML="<p>"+text+"<span>"+(countMes==0?'':('+'+countMes))+"</span>"+"</p>"+"<p class='onlineP'>online</p>";
    return div;
}
function insertElem(elem,className='')// вставить элемент
{
    if (className == '') className = 'message-box';
    var divBox=document.getElementById(className);
    divBox.append(elem);
  
}
function clearChat()// очистить чат
{
    var element = document.getElementById("message-box");
    while (element.firstChild) 
    {
        element.removeChild(element.firstChild);
    }
}
function updateChat(text,receive)// добавить в чат сообшение
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
    var onlineP = document.querySelectorAll('.onlineP');
    for (let i = 0; i < onlineP.length;i++)
    {
        onlineP[i].style.position ='relative' ;
        onlineP[i].style.top = '-35px';
        onlineP[i].style.left = '-80px';
    }
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
function strip_tags(originalString)// функция удаления спец символов html
{
    const strippedString = originalString.replace(/(<([^>]+)>)/gi, "");
    console.log(strippedString);
    return strippedString;
}
function sendMessage()// отправить сообшение
{
    var textarea = document.getElementById('textarea');
     
    var text = textarea.value;
    if (text.length>0 && checkSpaceOnly(text)==false)
    {
        textarea.value= '';  
        updateChat(text,1);      
        wsSendText(text);
        wsSendMessage(myLogin, selectHost, text);
    }

}
function inSystemMessanger(login='')// вход в систему
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
function checkSpaceOnly(str)
{
    let  flag = false;
    for (var i=0; i<str.length; i++)
    {
      if (str[i]!=' ') flag=true;
    }
    if (flag == true) return false; else return true;
}