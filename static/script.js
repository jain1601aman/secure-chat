const socket = io('http://pingersocial.el.r.appspot.com/', { transport : ['websocket', 'polling', 'flashsocket'] })
const messageform = document.getElementById('send-container');
const messagecontainer = document.getElementById('message-container');
const chatmsg = document.getElementById('message-input');

socket.on('send' , data =>{
    appendmessage(data)
})



/**************************************************************************************************************/
var keysize = 1024
var crypt = new JSEncrypt({ default_key_size: keysize });
var pubkey = crypt.getPublicKey()
var privkey = crypt.getPrivateKey()
crypt.setPrivateKey(privkey);
/**************************************************************************************************************/


const user = prompt('What is your name?')

socket.emit('new-user', {name : user,pubkey:pubkey})

messageform.addEventListener('submit' , e =>{
    e.preventDefault()
    const x = chatmsg.value.trim()
    if(x.length > 0){
    socket.emit('get-key' , user)
    socket.on('take-key' , key =>{
        encrypting(key)
    });}
})
function appendmessage(text)
{
    var encrypted = text.data
    const division = document.createElement('div');
    const decrypted = crypt.decrypt(encrypted);
    const s = text.user +' : ' + decrypted
    division.className = "b";
    division.innerText = s
    messagecontainer.appendChild(division)
    document.body.scrollIntoView(false);
}

function encrypting(pubkey1) {
    const x = chatmsg.value
    if(x.length > 0){
        var crypt2 = new JSEncrypt({ default_key_size: keysize });
        crypt2.setPublicKey(pubkey1);
        var message = crypt2.encrypt(x);
        chatmsg.value = '';
        const division = document.createElement('div');
        const s = user + ' : ' + x;
        division.className = "a";
        division.innerText = s;
        messagecontainer.appendChild(division);
        document.body.scrollIntoView(false);
        socket.emit('send-chat-message', message);
    }
    
};
