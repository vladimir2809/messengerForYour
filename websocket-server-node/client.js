const myWs = new WebSocket('ws://localhost:9000');
// обработчик проинформирует в консоль когда соединение установится
myWs.onopen = function () {
  console.log('подключился');
};
// обработчик сообщений от сервера
myWs.onmessage = function (message) {
  console.log('Message: %s', message.data);
};
// функция для отправки echo-сообщений на сервер
function wsSendEcho(value) {
  myWs.send(JSON.stringify({action: 'ECHO', data: value.toString()}));
}
// функция для отправки команды ping на сервер
function wsSendPing() {
  myWs.send(JSON.stringify({action: 'PING'}));
}