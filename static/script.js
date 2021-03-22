const socket = io('http://secure--chat.herokuapp.com/', { transport : ['websocket'] })
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

socket.emit('new-user', roomid, {name : user,pubkey:pubkey})

messageform.addEventListener('submit' , e =>{
    e.preventDefault()
    const x = chatmsg.value.trim()
    if(x.length > 0){
    socket.emit('get-key' , roomid,user)
    socket.on('take-key' , keys =>{
        encrypting(keys)
    });}
})
function appendmessage(text)
{
    var message
    var key
    text.data.forEach(element =>{
        if(element.name == user)
        {
            message = element.message
            key = element.enckey
        }
    })
    const division = document.createElement('div');
    const decrypted = crypt.decrypt(key);
    var dectext = CryptoJS.AES.decrypt(message,decrypted).toString(CryptoJS.enc.Utf8);
    const s = text.user +' : ' + dectext
    division.className = "b";
    division.innerText = s
    messagecontainer.appendChild(division)
    document.body.scrollIntoView(false);
}

function encrypting(pubkeys) {
    const x = chatmsg.value
    var key = Math.random().toString(36).substring(2);
    var enctext = CryptoJS.AES.encrypt(x,key).toString();
    if(x.length > 0){
        var arr = []
        pubkeys.forEach(element => {
        if(!(element.name == user))
        {
            var crypt2 = new JSEncrypt({ default_key_size: keysize });
            crypt2.setPublicKey(element.pubkey);
            var message = crypt2.encrypt(key);
            var obj = {
                name : element.name,
                enckey : message,
                message : enctext
            }
            arr.push(obj)
            
        } });
        chatmsg.value = '';
        const division = document.createElement('div');
        const s = user + ' : ' + x;
        division.className = "a";
        division.innerText = s;
        messagecontainer.appendChild(division);
        document.body.scrollIntoView(false);
        socket.emit('send-chat-message', roomid , arr);
    }
    
};
