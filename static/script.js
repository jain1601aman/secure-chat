const socket = io('http://secure--chat.herokuapp.com/', { transport: ['websocket'] })
const messageform = document.getElementById('send-container');
const messagecontainer = document.getElementById('message-container');
const chatmsg = document.getElementById('message-input');

socket.on('send', data => {
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

socket.emit('new-user', roomid, { name: user, pubkey: pubkey })
socket.on('take-msg', async data => {
    await data.forEach(async element => {
        await socket.emit('get-priv', roomid)
        await socket.once('take-priv', pkey => {
            crypt.setPrivateKey(pkey)
            var key = crypt.decrypt(element.key)
            var dectext = CryptoJS.AES.decrypt(element.msg, key).toString(CryptoJS.enc.Utf8);
            var verifyhash = CryptoJS.HmacSHA256(dectext, element.salt);
            var final = CryptoJS.enc.Base64.stringify(verifyhash);
            const division = document.createElement('div');
            if (final === element.hash) {
                {
                    if (element.name === user) {
                        const s = element.name + ' : ' + dectext
                        division.className = "a";
                        division.innerText = s
                    } else {
                        const s = element.name + ' : ' + dectext
                        division.className = "b";
                        division.innerText = s
                    }
                }

            } else {
                const s = "Server : Someone with false identity found. It's man in the middle attack!!!"
                division.className = "f";
                division.innerText = s
            }
            messagecontainer.appendChild(division)
            document.body.scrollIntoView(false);
        })
    })

})
messageform.addEventListener('submit', e => {
    e.preventDefault()
    const x = chatmsg.value.trim()
    if (x.length > 0) {
        socket.emit('get-key', roomid, user)
        socket.on('take-key', keys => {
            encrypting(keys)
        });
    }
})

function appendmessage(text) {
    var message
    var key
    var hash
    var salt
    text.data.forEach(element => {
        if (element.name == user) {
            message = element.message
            key = element.enckey
            hash = element.hash
            salt = element.salt
        }
    })
    const division = document.createElement('div');
    crypt.setPrivateKey(privkey)
    const decrypted = crypt.decrypt(key);
    var dectext = CryptoJS.AES.decrypt(message, decrypted).toString(CryptoJS.enc.Utf8);
    var verifyhash = CryptoJS.HmacSHA256(dectext, salt);
    var final = CryptoJS.enc.Base64.stringify(verifyhash);
    if (final === hash) {
        const s = text.user + ' : ' + dectext
        division.className = "b";
        division.innerText = s
    } else {
        const s = "Someone with false identity found. It's man in the middle attack!!!"
        division.className = "f";
        division.innerText = s
    }
    messagecontainer.appendChild(division)
    document.body.scrollIntoView(false);
}

function encrypting(pubkeys) {
    const x = chatmsg.value
    var key = Math.random().toString(36).substring(2);
    var salt = Math.random().toString(36).substring(2);
    var hashed = CryptoJS.HmacSHA256(x, salt);
    var hasheds = CryptoJS.enc.Base64.stringify(hashed);
    var enctext = CryptoJS.AES.encrypt(x, key).toString();
    if (x.length > 0) {
        var arr = []
        pubkeys.forEach(element => {
            if (!(element.name == user)) {
                var crypt2 = new JSEncrypt({ default_key_size: keysize });
                crypt2.setPublicKey(element.pubkey);
                var message = crypt2.encrypt(key);
                var obj = {
                    name: element.name,
                    enckey: message,
                    message: enctext,
                    hash: hasheds,
                    salt: salt
                }
                if (element.name === 'server') { socket.emit('add-msg', roomid, obj, user) } else { arr.push(obj) }

            }
        });
        chatmsg.value = '';
        const division = document.createElement('div');
        const s = user + ' : ' + x;
        division.className = "a";
        division.innerText = s;
        messagecontainer.appendChild(division);
        document.body.scrollIntoView(false);
        socket.emit('send-chat-message', roomid, arr);
    }

};
