let ws = null;
let nomeUsuario = '';

const availableEmojisCode = [    "😀",
    "😁",
    "😂",
    "😃",
    "😄",
    "😅",
    "🌑",
    "🌝",
    "🐒",
    "🐕",
    "🐬",
    "👆",
    "😀",
    "😁",
    "😂",
    "😃",
    "😄",
    "😅",
    "😆",
    "😇",
    "😈",
    "😉",
    "😊",
    "😋",
    "😌",
    "😍",
    "😎",
    "😏",
    "😐",
    "😑",
    "😒",
    "😓",
    "😔",
    "😕",
    "😖",
    "😗",
    "😘",
    "😙",
    "😚",
    "😛",
    "😜",
    "😝",
    "😞",
    "😟",
    "😠",
    "😡",
    "😢",
    "😣",
    "😤",
    "😥",
    "😦",
    "😧",
    "😨",
    "😩",
    "😪",
    "😫",
    "😬",
    "😭",
    "😮",
    "😯",
    "😰",
    "😱",
    "😲",
    "😳",
    "😴",
    "😵",
    "😶",
    "😷",
    "🙁",
    "🙂",
    "🙃",
    "🙄",
    "🤐",
    "🤑",
    "🤒",
    "🤓",
    "🤔",
    "🤕",
    "🤠",
    "🤡",
    "🤢",
    "🤣",
    "🤤",
    "🤥",
    "🤧",
    "🤨",
    "🤩",
    "🤪",
    "🤫",
    "🤬",
    "🤭",
    "🤮",
    "🤯",
    "☝",
    "⛹",
    "✊",
    "✋",
    "✌",
    "✍",
    "🎅",
    "🏂",
    "🏃",
    "🏄",
    "🏇",
    "🏊",
    "🏋",
    "🏌",
    "👂",
    "👃",
    "👆",
    "👇",
    "👈",
    "👉",
    "👊",
    "👋",
    "👌",
    "👍",
    "👎",
    "👏",
    "👐",
    "👦",
    "👧",
    "👨",
    "👩",
    "👮",
    "👰",
    "👱",
    "👲",
    "👳",
    "👴",
    "👵",
    "👶",
    "👷",
    "👸",
    "👼",
    "💁",
    "💂",
    "💃",
    "💅",
    "💆",
    "💇",
    "💪",
    "🕴",
    "🕵",
    "🕺",
    "🖐",
    "🖕",
    "🖖",
    "🙅",
    "🙆",
    "🙇",
    "🙋",
    "🙌",
    "🙍",
    "🙎",
    "🙏",
    "🚣",
    "🚴",
    "🚵",
    "🚶",
    "🛀",
    "🛌",
    "🤘",
    "🤙",
    "🤚",
    "🤛",
    "🤜",
    "🤝",
    "🤞",
    "🤟",
    "🤦",
    "🤰",
    "🤱",
    "🤲",
    "🤳",
    "🤴",
    "🤵",
    "🤶",
    "🤷",
    "🤸",
    "🤹",
    "🤽",
    "🤾",
    "🧑",
    "🧒",
    "🧓",
    "🧔",
    "🧕",
    "🧖",
    "🧗",
    "🧘",
    "🧙",
    "🧚",
    "🧜"];

function showView(viewName) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('chat-view').style.display = 'none';

    if (viewName === 'home') {
        document.getElementById('home-view').style.display = 'block';
    } else if (viewName === 'chat') {
        document.getElementById('chat-view').style.display = 'block';
    }
}

window.onload = function() {
    showView('home');
    document.getElementById('mensagem-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            enviarMensagem();
        }
    });
};

function connectAndGoToChat() {
    const nomeInputArea = document.getElementById('nome-input-area');
    const nomeInput = document.getElementById('nome');
    nomeUsuario = nomeInput.value.trim();

    if (!nomeUsuario) {
        adicionarMensagem({ remetente: "ALERTA", texto: "Por favor, digite sua identificação para entrar no chat.", tipo: "sistema" });
        return;
    }

    nomeInputArea.style.display = 'none';
    showView('chat');
    
    document.getElementById('nome-usuario-logado').textContent = `Conectado como: ${nomeUsuario}`;
    
    const ws_protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws_url = `${ws_protocol}://${window.location.host}/ws/${encodeURIComponent(nomeUsuario)}`;
    
    try {
        ws = new WebSocket(ws_url);
        
        document.getElementById('status-conexao').textContent = "Conectando...";
        document.getElementById('status-conexao').style.color = "orange";
        
        ws.onopen = function() {
            document.getElementById('status-conexao').textContent = "Conectado";
            document.getElementById('status-conexao').style.color = "green";
        };

        ws.onmessage = function(e) {
            const data = JSON.parse(e.data);
            
            if (data.tipo === "online_list") {
                updateOnlineUsersList(data.usuarios);
            } else {
                adicionarMensagem(data);
            }
            
            if (data.remetente === "ERRO" && data.texto.includes("já está conectado")) {
                 ws.close(); 
                 nomeInputArea.style.display = 'block'; 
            }
        };

        ws.onclose = function() {
            document.getElementById('status-conexao').textContent = "Desconectado";
            document.getElementById('status-conexao').style.color = "red";
            updateOnlineUsersList([]);

            nomeInputArea.style.display = 'block'; 
        };

        ws.onerror = function(err) {
            document.getElementById('status-conexao').textContent = "Erro na Conexão";
            document.getElementById('status-conexao').style.color = "red";
            nomeInputArea.style.display = 'block';
        };

    } catch (error) {
        document.getElementById('status-conexao').textContent = "Erro Fatal na Conexão";
        document.getElementById('status-conexao').style.color = "darkred";
        nomeInputArea.style.display = 'block';
    }
}

function enviarMensagem() {
    const input = document.getElementById('mensagem-input');
    const mensagem = input.value.trim();

    if (ws && ws.readyState === WebSocket.OPEN && mensagem) {
        ws.send(mensagem);
        input.value = '';
    }
    toggleEmoticonPopup(true);
}

function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    if (!nomeUsuario || nomeUsuario.trim() === '') {
        adicionarMensagem({ 
            remetente: "ERRO", 
            texto: "Não é possível fazer o upload de arquivos. Seu nome de usuário não está definido.", 
            tipo: "sistema" 
        });
        return; 
    }
    
    const formData = new FormData();
    formData.append("nome_usuario", nomeUsuario); 
    formData.append("file", file);
    
    const uploadMessage = {
        remetente: "SISTEMA",
        texto: `Enviando arquivo: ${file.name}...`,
        tipo: "sistema"
    };
    adicionarMensagem(uploadMessage);

    fetch('/uploadfile/', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.detail ? JSON.stringify(err.detail) : 'Falha no upload do arquivo'); });
        }
        return response.json();
    })
    .then(data => {
        console.log("Upload concluído:", data.filename);
        fileInput.value = ''; 
    })
    .catch(error => {
        console.error("Erro detalhado de upload:", error);
        adicionarMensagem({ 
            remetente: "ERRO", 
            texto: `Não foi possível fazer o upload de ${file.name}. Verifique o console.`, 
            tipo: "sistema" 
        });
    });
}

function adicionarMensagem(data) {
    const chatLog = document.getElementById('chat-log');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');

    if (data.tipo === 'sistema' || data.tipo === 'alerta' || data.tipo === 'erro') {
        messageDiv.classList.add('chat-system');
        messageDiv.innerHTML = data.texto;
    } else if (data.tipo === 'arquivo') {
        messageDiv.classList.add('chat-file');
        
        
        const linkText = data.texto.replace("ANEXOU O ARQUIVO: ", "").replace(". [Clique para baixar]", "");
        
        messageDiv.innerHTML = `
            <strong>${data.remetente}</strong> anexou um arquivo:
            <br>
            <a href="${data.url}" target="_blank" class="file-link">${linkText}</a>
        `;
    } else {
        const isSelf = data.remetente === nomeUsuario;
        messageDiv.classList.add(isSelf ? 'chat-self' : 'chat-other');
        messageDiv.innerHTML = `<strong>${data.remetente}</strong><br>${data.texto}`;
    }

    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function toggleEmoticonPopup(hide = false) {
    const popup = document.getElementById('emoticon-popup');
    if (hide || popup.style.display === 'block') {
        popup.style.display = 'none';
        return;
    }

    popup.innerHTML = '';
    availableEmojisCode.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.classList.add('emoticon-btn');
        btn.onclick = () => {
            const input = document.getElementById('mensagem-input');
            input.value += emoji;
            input.focus();
        };
        popup.appendChild(btn);
    });
    popup.style.display = 'block';
}

function updateOnlineUsersList(users) {
    const listElement = document.getElementById('online-list');
    listElement.innerHTML = '';
    
    const countElement = document.getElementById('online-user-count');
    countElement.textContent = users.length;

    users.forEach(user => {
        const listItem = document.createElement('li');
        listItem.textContent = user + (user === nomeUsuario ? ' (Você)' : '');
        listElement.appendChild(listItem);
    })
}