# secure-chat
Secure chat is an end-to-end encrypted platform for creating chat rooms and sending encrypted
messages. Encryption and decryption of data are done on the client-side which makes it a little
more secure. Encryption is done using a combination of a Symmetric and Asymmetric key exchange
mechanism. Backend is based on Node.js, frontend is created using HTML, CSS, and Javascript,
Middleware used is express, MongoDB is used as a Database and Socket.io takes care of
real-time communication.
## Workflow
### Room Creation
Users can create a room upon which a DB entry in the “rooms” collection gets saved. Now when
users try to login into this room, it gets verified from DB collection. After login, a collection named
the same as chat room will be created that will be used to store all user details along with their
public key.
### Communication Between Users
As the user sends a message in the chat room, this message will get encrypted with a common
room key CK (Symmetric encryption). Now all other users' public keys will be requested from DB
and CK will be encrypted with each user’s public key EK and make an object containing the User’s
name, encrypted message, and EK. now an array of these objects will be sent to each listening
user and that user will take their object (i.e. object that has their name as user name).
Now, as all users have their respective object with encrypted message and EK, they will decrypt
EK using their private key to decrypt EK and obtain CK and further use CK to decrypt the encrypted
message.
