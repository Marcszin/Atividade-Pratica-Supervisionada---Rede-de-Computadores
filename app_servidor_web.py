import asyncio
from fastapi import FastAPI, WebSocket, Request, File, UploadFile, HTTPException, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
import json
import os
import aiofiles

app = FastAPI()

UPLOAD_DIR = "uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/files", StaticFiles(directory=UPLOAD_DIR), name="files")
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

clientes_ativos: dict[str, WebSocket] = {}

async def broadcast_message(message: str, ws_excluir: WebSocket = None):
    tarefas_envio = []
    clientes_para_enviar = list(clientes_ativos.values())

    for cliente in clientes_para_enviar:
        if cliente != ws_excluir:
            tarefas_envio.append(cliente.send_text(message))

    await asyncio.gather(*tarefas_envio, return_exceptions=True)


async def broadcast_user_list():
    nomes_online = list(clientes_ativos.keys())
    mensagem_lista = {
        "remetente": "SISTEMA",
        "tipo": "online_list",
        "usuarios": nomes_online
    }
    await broadcast_message(json.dumps(mensagem_lista), None)



@app.get("/")
async def get_root(request: Request):
    return templates.TemplateResponse("cliente.html", {"request": request})

@app.post("/uploadfile/")
async def create_upload_file(nome_usuario: str = Form(...), file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await file.read(1024):
                await out_file.write(content)

        file_url = f"/files/{safe_filename}"

        mensagem_notificacao = {
            "remetente": nome_usuario,
            "texto": f"ANEXOU O ARQUIVO: {file.filename}. [Clique para baixar]",
            "tipo": "arquivo",
            "url": file_url
        }

        await broadcast_message(json.dumps(mensagem_notificacao), None)

        return {"filename": file.filename, "url": file_url}

    except Exception as e:
        print(f"Erro no upload de arquivo: {e}")
        raise HTTPException(status_code=500, detail=f"Falha no processamento do arquivo: {e}")



@app.websocket("/ws/{nome_usuario}")
async def websocket_endpoint(websocket: WebSocket, nome_usuario: str):
    
    if nome_usuario in clientes_ativos:
        print(f"Tentativa de conexão duplicada rejeitada para: {nome_usuario}")
        await websocket.accept()
        await websocket.send_text(json.dumps({
            "remetente": "ERRO",
            "texto": "Seu nome de usuário já está conectado em outro local.",
            "tipo": "sistema"
        }))
        await websocket.close()
        return

    await websocket.accept()
    clientes_ativos[nome_usuario] = websocket

    mensagem_entrada = {
        "remetente": "SISTEMA",
        "texto": f"{nome_usuario} entrou no chat.",
        "tipo": "sistema"
    }
    await broadcast_message(json.dumps(mensagem_entrada), None)
    
    await broadcast_user_list() 

    print(f"Conexão WebSocket estabelecida para: {nome_usuario}")

    try:
        while True:
            dados = await websocket.receive_text()

            mensagem = {
                "remetente": nome_usuario,
                "texto": dados,
                "tipo": "chat"
            }

            print(f" (CHAT) {nome_usuario}: {dados}")

            await broadcast_message(json.dumps(mensagem), None)

    except Exception as e:
        print(f"Conexão encerrada para {nome_usuario}. Erro: {e.__class__.__name__}")

    finally:
        if nome_usuario in clientes_ativos:
            del clientes_ativos[nome_usuario]

            mensagem_saida = {
                "remetente": "SISTEMA",
                "texto": f"{nome_usuario} saiu.",
                "tipo": "sistema"
            }
            await broadcast_message(json.dumps(mensagem_saida), None)
            
            await broadcast_user_list()


if __name__ == "__main__":
    print("Iniciando o Servidor Web/WebSocket em http://0.0.0.0:8000")
    print("Acesse http://localhost:8000 no seu navegador.")
    uvicorn.run("app_servidor_web:app", host="0.0.0.0", port=8000, reload=True)