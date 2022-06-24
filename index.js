 //On instancie express 
 const express = require("express"); //*empeche de charger des fichiers tiers (comme stylesheet)
const app = express();

//on charge "path" pour pointer le chemin des fichiers statiques
const path = require("path");

//on charge/autorise le dossier public (pour pouvoir utiliser les tiers dans html)
app.use(express.static(path.join(__dirname, "public")));

 //creation du serveur http
 const http = require("http").createServer(app);

 //on instancie un socket.io
 const ioConnect = require("socket.io")(http);

 //on charge sequelize (node module pour la bdd)
const Sequelize = require("sequelize");
//on fabrique le lien de la bdd
const dbPath = path.resolve(__dirname, "chat.sqlite");
//on se connecte à la base
const sequelizeConnect = new Sequelize("database" , "username" , "password" , {
    host:"localhost",
    dialect:"sqlite",
    logging : false,
    storage: dbPath
});
//on charge le modele "chat" chat.js

const Chat = require('./Models/Chat')(sequelizeConnect, Sequelize.DataTypes);

//chargement reel -> cree un fichier sqlite
Chat.sync();

 //on crée la route
 app.get("/" , (req, res) =>{
     res.sendFile(__dirname + "/index.html");
 })

 //on écoute l'évenement "connection" de 'linstance
 ioConnect.on("connection", (socket)=> {
     console.log("une connexion s'active");

     //on écoute les déconnexions , inclut les rafraichissements de page
    socket.on("disconnect", () =>{
        console.log("un utilisateur s'est déconnecté");
    });
    //on écoute les entrées dans les salles
    socket.on("enter_room", (room) => {
        //on entre dans la salle demandée 
        socket.join(room);
        console.log(socket.rooms); 
    });
    socket.on("leave_room", (room) => {
        //on entre dans la salle demandée 
        socket.leave(room);
        console.log(socket.rooms); 
        //On envoie tous les messages du salon
        Chat.findAll({
            attributes:["id", "name", "message", "room", "createdAt"],
            where:{
                room:room
            }
        }).then(list => {
            socket.emit("init_messages", {messages:JSON.stringify(list)});
        });

    });
    //on gère le chat
    socket.on("chat_message", (msg) =>{
        console.log(msg);
        //on stocke le msg dans la base
        const message = Chat.create({
            name: msg.name,
            message: msg.message,
            room : msg.room,
            createdAt : msg.createdAt
        }).then(() => { //relaie aux user dans le salon
                ioConnect.in(msg.room).emit("received_message", msg);
        }).catch(e => {
            console.log(e);
        });
        //envoie/ relaie du message à tous ceux qui vont écouter chat msg
        //toutes les connexions au socket (port 3000) reçoivent le message
        //test sur deux fenetres 
       // ioConnect.emit("received_message", msg);
    })
    //on ecoute les messages typing
    socket.on("typing", msg =>{
        socket.to(msg.room).emit("usertyping", msg);
    })
 });
 //on demande au server http de répondre sur le port 3000
 http.listen(3000, ()=> {
     console.log("serveur en route");
 })
 