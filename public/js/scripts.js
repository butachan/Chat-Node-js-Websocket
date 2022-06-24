const socket = io();

//on gère l'arrivé d'un nouvel utilisateur
socket.on("connect", ()=> {
    //on émet un msg qui indique qu'un client est entré
    socket.emit("enter_room" , "general");
});
        window.onload = () => {
            //on écoute l'évenement submit
            document.querySelector("form").addEventListener("submit", (e) => {
                //on empêche l'envoi du formulaire (activé par défaut)
                e.preventDefault()
             
                const name = document.querySelector("#name");
                const message = document.querySelector("#message");
                const room = document.querySelector("#tabs li.active").dataset.room;
                const createdAt = new Date();

                console.log(name,message)
                
                //on envoie le message
                socket.emit("chat_message" , { name:name.value, 
                                                message: message.value,
                                            room : room,
                                           createdAt : createdAt });
                //ergonomie :
                document.querySelector("#message").value="";
            });
                //on écoute l'évenement "chat_message" et recupere 
                socket.on("received_message", (msg) =>{
                  publishMessages(msg);
                })

                //on écoute les clics sur les onglets
                document.querySelectorAll("#tabs li").forEach((tab) => {
                    tab.addEventListener("click", function(){
                        //si le tab n'est pas actif, on peut l'activer
                        if(!this.classList.contains("active")){
                            const actif = document.querySelector("#tabs li.active");
                            actif.classList.remove("active");
                            this.classList.add("active");
                            document.querySelector("#canalMessage").innerHTML = "";
                             //on quitte la salle précedente
                             socket.emit("leave_room", actif.dataset.room);
                            //on entre dans la nouvelle salle
                            socket.emit("enter_room", this.dataset.room);
                           
                        }
                    })
                });

            //on écoute l'event int message
            socket.on("init_messages", msg => {
                let data = JSON.parse(msg.messages);
                if(data != []){
                    data.forEach(donnees =>{
                        publishMessages(donnees);
                    })
                }
            });
            //écoute la frappe au clavier (qui ecrit)
            document.querySelector("#message").addEventListener("input", () =>{
                //on récupère le nom
                const name = document.querySelector("#name").value;
                //on récupère le salon
                const room = document.querySelector("#tabs li.active").dataset.room;
                socket.emit("typing", {
                    name: name,
                    room : room
                });
            });
            socket.on("usertyping", msg =>{
                const writing = document.querySelector("#writing");
                writing.innerHTML = `${msg.name} tape un message`;
                setTimeout(function(){
                    writing.innerHTML ="";} , 5000);
            });
        }
function publishMessages(msg){
    let created = new Date(msg.createdAt);
    let texte = `<div><p>${msg.name} <small>${created.toLocaleDateString()}</small></p><p>${msg.message}</p></div>`
    document.querySelector("#canalMessage").innerHTML += texte;
}