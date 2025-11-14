const http = require('http');
const express = require('express');
const { render } = require('ejs');
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const uri = `mongodb+srv://orlandonagrockis:onabe123@nightsky.s4il00r.mongodb.net/?appName=NightSKY`;

const client = new MongoClient(uri, { useNewUrlParser: true});

var app = express();
const path = require('path');
const basePath = (process.pkg)  ? path.dirname(process.execPath)  : __dirname;
app.use(express.static(path.join(basePath, 'public')));
app.set('view engine', 'ejs');
app.set('views',  path.join(basePath, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

async function startServer() {
    try {
        await client.connect();
        const usuario = client.db("NightSKY").collection("Usuário");
        await usuario.createIndex({db_email: 1}, {unique: true});
        app.listen(3000, () => {
            console.log('Servidor iniciado');
        });
    } catch (err) {
        console.error("Não foi possível iniciar o servidor", err);
        process.exit(1);
    }
}

app.get('/', (req, res) => {
    return res.render("login_usuario.ejs", { resposta: "" });
});

app.get('/voltarlogin', function (req, res){
    return res.render("login_usuario.ejs", {resposta: ""});
})

app.get('/voltarcadastro_jogador', function (req, res){
    return res.render("cadastro_jogador.ejs", { resposta: "" });
})

app.get('/voltarcadastro_dev', function (req, res){
    return res.render("cadastro_dev.ejs", { resposta: "" });
})

app.get('/voltarcadastro_publisher', function (req, res){
    return res.render("cadastro_publisher.ejs", { resposta: "" });
})

app.get('/ircadastro_jogo', async (req, res) =>{
    const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
    return res.render("cadastro_jogo.ejs", { resposta: "", devs });
})

app.get('/iradicionar_jogo', function (req, res){
    return res.render("adicionar_jogo.ejs", { resposta: "" });
})

app.get('/irtroca/:amigo', async (req, res) => {
    email_amigo = req.params.amigo
    const amigo_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email_amigo}).toArray()
    const jogador_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email}).toArray()
    return res.render("solicitar_troca.ejs", { resposta: "", meusjogos: jogador_jogos, seusjogos: amigo_jogos });
})

app.get('/irlista_amigos', async (req, res) => {
    const lista_amigos = await client.db("NightSKY").collection("Pedidos_Amizade").find(
        {$or: [
            { db_jogador: email },
            { db_amigo: email }], db_status: "Aceito"}).toArray()
    const nome_amigos = []
    for(const amigo of lista_amigos) {
        if (amigo.db_jogador === email) {
            email_amigo = amigo.db_amigo
        } else {
            email_amigo = amigo.db_jogador
        }
        const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
        let nome_amigo;
        if (amigo_jogador) {
            nome_amigo = amigo_jogador.db_nome;
        }
        nome_amigos.push({nome: nome_amigo, emailamigo: email_amigo});
    }
    return res.render("lista_amigos.ejs", { lista: nome_amigos, resposta: "" });
})

app.get('/irperfil', async (req, res) => {
    const perfil = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email });
    return res.render("pagina_perfil.ejs", {usuario: perfil });
})

app.get('/irsolicitacoes', async (req, res) => {
    const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_jogador: email, db_status: "Pendente"}).toArray()
    const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_amigo: email, db_status: "Pendente"}).toArray()
    const nome_pendentes = []
    const nome_recebidas = []
    for(const amigo of solicitacoes_pendentes) {
        email_amigo = amigo.db_amigo
        const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
        let nome_amigo;
        if (amigo_jogador) {
            nome_amigo = amigo_jogador.db_nome;
        }
        nome_pendentes.push({nome: nome_amigo});
    }
    for(const amigo of solicitacoes_recebidas) {
        email_amigo = amigo.db_jogador
        const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
        let nome_amigo;
        if (amigo_jogador) {
            nome_amigo = amigo_jogador.db_nome;
        }
        nome_recebidas.push({nome: nome_amigo, _id: amigo._id});
    }
    return res.render("solicitacoes.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
})

app.get('/irpedidos_troca', async (req, res) => {
    const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
    const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
    const nome_pendentes = []
    const nome_recebidas = []
    for(const amigo of solicitacoes_pendentes) {
        email_amigo = amigo.db_amigo
        const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
        let nome_amigo;
        if (amigo_jogador) {
            nome_amigo = amigo_jogador.db_nome;
        }
        nome_pendentes.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber});
    }
    for(const amigo of solicitacoes_recebidas) {
        email_amigo = amigo.db_jogador
        const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
        let nome_amigo;
        if (amigo_jogador) {
            nome_amigo = amigo_jogador.db_nome;
        }
        nome_recebidas.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber, emailamigo: email_amigo, _id: amigo._id, id_enviar: amigo.db_id_enviar, id_receber: amigo.db_id_receber});
    }
    return res.render("pedidos_troca.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
})

app.get('/ireditar/:id', async (req, res) => {
    const id_jogo = new ObjectId(req.params.id)
    const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
    const jogo = await client.db('NightSKY').collection('Jogos').findOne({ _id: id_jogo });
    return res.render("editar_jogo.ejs", { resposta: "", jogo: jogo, devs });
})


app.get('/navegar', async (req, res) => {
    if(tipo == "Publisher"){
        const total_jogos =  await client.db("NightSKY").collection("Jogos").countDocuments({db_publisher: email})
        const meus_jogos = await client.db("NightSKY").collection("Jogos").find({db_publisher: email}).toArray()
        return res.render("total_jogos.ejs", {cadastrojogo: "Cadastrar novo jogo", resposta: total_jogos, meusjogos: meus_jogos});
    }
    else if(tipo == "Dev"){
        const total_jogos =  await client.db("NightSKY").collection("Jogos").countDocuments({db_dev: email})
        const meus_jogos = await client.db("NightSKY").collection("Jogos").find({db_dev: email}).toArray()
        return res.render("meus_jogos.ejs", {cadastrojogo: "", resposta: total_jogos, meusjogos: meus_jogos});
    }
    else if(tipo == "Jogador"){
        const total_jogos =  await client.db("NightSKY").collection("Biblioteca").countDocuments({db_jogador: email})
        const biblioteca = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email}).toArray()
        return res.render("biblioteca.ejs", {resposta: total_jogos, minha_biblioteca: biblioteca});
    }
})

app.get('/voltarcatalogo', async (req, res)=> {
    const catalogo_jogos = await client.db("NightSKY").collection("Jogos").find().toArray()
    if(tipo == "Jogador"){
        return res.render('catalogo', {resposta: "Biblioteca", catalogo: catalogo_jogos, listaamigos:"Amigos"})
    }
    else if(tipo == "Dev"){
        return res.render('catalogo', {resposta: "Meus jogos", catalogo: catalogo_jogos, listaamigos:""})
    }
    else if(tipo == "Publisher"){
        return res.render('catalogo', {resposta: "Gerenciar jogos", catalogo: catalogo_jogos, listaamigos:""})
    }
})

app.get('/pagina_jogo/:id', async (req, res) => {
    const jogo = await client.db("NightSKY").collection("Jogos").findOne({ _id: new ObjectId(req.params.id) });
    const publisher = await client.db("NightSKY").collection("Usuário").findOne({ db_email: jogo.db_publisher });
    let publisher_nome;
    if (publisher) {
        publisher_nome = publisher.db_nome;
    }
    const dev = await client.db("NightSKY").collection("Usuário").findOne({ db_email: jogo.db_dev });
    let dev_nome;
    if (dev) {
        dev_nome = dev.db_nome;
    }
    const verificar = await client.db("NightSKY").collection("Biblioteca").findOne({ db_jogo_id: new ObjectId(req.params.id), db_jogador: email });
    if(verificar === null && tipo === "Jogador"){
        return res.render('pagina_jogo', { jogo, publisher: publisher_nome, dev: dev_nome , comprar:"Adicionar a biblioteca"});
    }
    return res.render('pagina_jogo', { jogo, publisher: publisher_nome, dev: dev_nome, comprar:"" });
})


tipo = ""
email = ""
email_amigo = ""

app.post("/cadastrar_jogador", async (req, resp) => {
    try {
        if(req.body.nome == "" || req.body.senha == "" || req.body.email == ""){
            return resp.render('cadastro_jogador', {resposta: "Não deixe campos em branco!"})
        }
        const hash = await bcrypt.hash(req.body.senha, 10);
        await client.db("NightSKY").collection("Usuário").insertOne(
            {db_nome: req.body.nome, db_email: req.body.email, db_senha: hash, db_tipo_conta: "Jogador"}
        )
        email = req.body.email;
        tipo = "Jogador"
        const catalogo_jogos = await client.db("NightSKY").collection("Jogos").find().toArray()
        return resp.render('catalogo', {resposta: "Biblioteca",catalogo: catalogo_jogos, listaamigos: "Amigos" })
    }
    catch (err) {
        if(err.code === 11000){
            return resp.render('cadastro_jogador', {resposta: "Esse email já foi utilizado!"})
        }
        return resp.render('cadastro_jogador', {resposta: "Erro ao cadastrar jogador!"})
    }
});

app.post("/cadastrar_dev", async (req, resp) => {
    try {
        if(req.body.nome == "" || req.body.senha == "" || req.body.email == ""){
            return resp.render('cadastro_dev', {resposta: "Não deixe campos em branco!"})
        }
        const hash = await bcrypt.hash(req.body.senha, 10);
        await client.db("NightSKY").collection("Usuário").insertOne(
            {db_nome: req.body.nome, db_email: req.body.email, db_senha: hash, db_tipo_conta: "Dev"}
        )
        tipo = "Dev"
        email = req.body.email;
        const catalogo_jogos = await client.db("NightSKY").collection("Jogos").find().toArray()
        return resp.render('catalogo', {resposta: "Meus jogos", catalogo: catalogo_jogos, listaamigos:""})
    }
    catch (err) {
        if(err.code === 11000){
            return resp.render('cadastro_dev', {resposta: "Esse email já foi utilizado!"})
        }
        return resp.render('cadastro_dev', {resposta: "Erro ao cadastrar desenvolvedor!"})
    }
});

app.post("/cadastrar_publisher", async (req, resp) => {
    try {
        if(req.body.nome == "" || req.body.senha == "" || req.body.email == "" || req.body.cnpj == ""){
            return resp.render('cadastro_publisher', {resposta: "Não deixe campos em branco!"})
        }
        const hash = await bcrypt.hash(req.body.senha, 10);
        await client.db("NightSKY").collection("Usuário").insertOne(
            {db_nome: req.body.nome, db_email: req.body.email, db_senha: hash, db_cnpj: req.body.cnpj, db_tipo_conta: "Publisher"}
        )
        tipo = "Publisher"
        email = req.body.email;
        const catalogo_jogos = await client.db("NightSKY").collection("Jogos").find().toArray()
        return resp.render('catalogo', {resposta: "Gerenciar jogos", catalogo: catalogo_jogos, listaamigos:""})
    }
    catch (err) {
        if(err.code === 11000){
            return resp.render('cadastro_publisher', {resposta: "Esse email já foi utilizado!"})
        }
        return resp.render('cadastro_publisher', {resposta: "Erro ao cadastrar publisher!"})
    }
});

app.post("/logar_usuario", async (req, resp) => {
    try {
        if(req.body.senha == "" || req.body.email == "" || req.body.cnpj == ""){
            return resp.render('login_usuario', {resposta: "Não deixe campos em branco!"})
        }
        const verificar_email = await client.db("NightSKY").collection("Usuário").findOne(
            {db_email: req.body.email}
        )
        if(verificar_email == null){
            return resp.render('login_usuario', {resposta: "Email não encontrado!"})
        }
        const verificar_senha = await bcrypt.compare(req.body.senha, verificar_email.db_senha);
        if(!verificar_senha){
            return resp.render('login_usuario', {resposta: "Senha errada!"})
        }
        tipo = verificar_email.db_tipo_conta
        email = req.body.email;
        const catalogo_jogos = await client.db("NightSKY").collection("Jogos").find().toArray()
        if(tipo == "Jogador"){
            return resp.render('catalogo', {resposta: "Biblioteca", catalogo: catalogo_jogos, listaamigos:"Amigos"})
        }
        else if(tipo == "Dev"){
            return resp.render('catalogo', {resposta: "Meus jogos", catalogo: catalogo_jogos, listaamigos:""})
        }
        else if(tipo == "Publisher"){
            return resp.render('catalogo', {resposta: "Gerenciar jogos", catalogo: catalogo_jogos, listaamigos:""})
        }
    }
    catch (err) {
        return resp.render('login_usuario', {resposta: "Erro ao logar!"})
    }
});

app.post("/cadastrar_jogo", async (req, resp) => {
    try {
        if(req.body.nome_jogo == "" || req.body.descricao == "" || req.body.dev == "" || !req.body.categoria || req.body.preco == ""){
            const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
            return resp.render('cadastro_jogo', {resposta: "Não deixe campos em branco!", devs})
        }
        let categorias = req.body.categoria;
        if (typeof categorias === 'string') {
            categorias = [categorias];
        }
        const verificar_jogo = await client.db("NightSKY").collection("Jogos").findOne({ db_nome_jogo: req.body.nome_jogo, db_publisher: email });
        if(verificar_jogo != null){
            const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
            return resp.render('cadastro_jogo', {resposta: "Jogo com esse nome já cadastrado pela publisher!", devs})
        }

        await client.db("NightSKY").collection("Jogos").insertOne(
            {db_nome_jogo: req.body.nome_jogo, db_descricao: req.body.descricao, db_dev: req.body.dev, db_categoria: categorias, db_publisher: email, db_preço: req.body.preco, db_imagem: req.body.imagem_jogo}
        )
        const total_jogos =  await client.db("NightSKY").collection("Jogos").countDocuments({db_publisher: email})
        const meus_jogos = await client.db("NightSKY").collection("Jogos").find({db_publisher: email}).toArray()
        return resp.render("total_jogos.ejs", {cadastrojogo: "Cadastrar novo jogo", resposta: total_jogos, meusjogos: meus_jogos});
    }
    catch (err) {
        console.log(err);
        const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
        return resp.render('cadastro_jogo', {resposta: "Erro ao cadastrar jogo!", devs})
    }
});

app.post("/adicionar_biblioteca", async (req, resp) => {
    try {
        const id_jogo = new ObjectId(req.body.id)
        await client.db("NightSKY").collection("Biblioteca").insertOne(
            {db_jogo_id:id_jogo, db_nome_jogo: req.body.nome_jogo, db_jogador: email, db_imagem_jogo: req.body.imagem}
        )
        const total_jogos =  await client.db("NightSKY").collection("Biblioteca").countDocuments({db_jogador: email})
        const biblioteca = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email}).toArray()
        return resp.render("biblioteca.ejs", {resposta: total_jogos, minha_biblioteca: biblioteca});
    }
    catch (err) {
        return resp.render('adicionar_jogo', {resposta: "Erro ao adicionar jogo!"})
    }
});

app.post("/adicionar_amigo", async (req, resp) => {
    try {
        const amigo = await client.db("NightSKY").collection("Usuário").findOne({ db_nome: req.body.amigo_nome });
        const verificar_estado = await client.db("NightSKY").collection("Pedidos_Amizade").findOne({ db_amigo: amigo.db_email, db_jogador: email });
        if (verificar_estado) {
            const status = verificar_estado.db_status;
            if (status === "Aceito" || status === "Pendente") {
                const lista_amigos = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_jogador: email, db_status: "Aceito"}).toArray()
                return resp.render('lista_amigos', { resposta: "Solicitação já enviada anteriormente!", lista: lista_amigos });
            }
        }
        let verificar_tipo = amigo.db_tipo_conta
        const lista_amigos = await client.db("NightSKY").collection("Pedidos_Amizade").find(
            {$or: [
                    { db_jogador: email },
                    { db_amigo: email }], db_status: "Aceito"}).toArray()
        if(verificar_tipo !== "Jogador"){
            return resp.render('lista_amigos', {resposta: "Jogador não encontrado!", lista : lista_amigos})
        }
        let amigo_email = amigo.db_email
        const verificar_amigo = await client.db("NightSKY").collection("Usuário").findOne({ db_email: amigo_email });
        if (verificar_amigo == null) {
            return resp.render('lista_amigoss', {resposta: "Jogador não encontrado!", lista : lista_amigos})
        }
        await client.db("NightSKY").collection("Pedidos_Amizade").insertOne({
            db_jogador: email, db_amigo: amigo_email, db_status: "Pendente"
        });
        const nome_amigos = []
        for(const amigo of lista_amigos) {
            if (amigo.db_jogador === email) {
                email_amigo = amigo.db_amigo
            } else {
                email_amigo = amigo.db_jogador
            }
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_amigos.push({nome: nome_amigo, emailamigo: email_amigo});
        }
        return resp.render("lista_amigos.ejs", { lista: nome_amigos, resposta: "" });
    }
    catch (err) {
        const lista_amigos = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_jogador: email, db_status: "Aceito"}).toArray()
        return resp.render('lista_amigos', {resposta: "Erro ao enviar solicitação de amizade!", lista: lista_amigos})
    }
});

app.post("/aceitar_amigo", async (req, resp) => {
    try {
        await client.db("NightSKY").collection("Pedidos_Amizade").updateOne(
            {_id: new ObjectId(req.body.id)},
            {$set: {db_status: "Aceito"}}
        )
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_amigo: email, db_status: "Pendente"}).toArray()
        const nome_pendentes = []
        const nome_recebidas = []
        for(const amigo of solicitacoes_pendentes) {
            email_amigo = amigo.db_amigo
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_pendentes.push({nome: nome_amigo});
        }
        for(const amigo of solicitacoes_recebidas) {
            email_amigo = amigo.db_jogador
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_recebidas.push({nome: nome_amigo, _id: amigo._id});
        }
        return resp.render("solicitacoes.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
    }
    catch (err) {
        return resp.render('solicitacoes', {resposta: "Erro ao aceitar solicitação de amizade!"})
    }
});

app.post("/recusar_amigo", async (req, resp) => {
    try {
        await client.db("NightSKY").collection("Pedidos_Amizade").updateOne(
            {_id: new ObjectId(req.body.id)},
            {$set: {db_status: "Recusado"}}
        )
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Amizade").find({db_amigo: email, db_status: "Pendente"}).toArray()
        const nome_pendentes = []
        const nome_recebidas = []
        for(const amigo of solicitacoes_pendentes) {
            email_amigo = amigo.db_amigo
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_pendentes.push({nome: nome_amigo});
        }
        for(const amigo of solicitacoes_recebidas) {
            email_amigo = amigo.db_jogador
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_recebidas.push({nome: nome_amigo, _id: amigo._id});
        }
        return resp.render("solicitacoes.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
    }
    catch (err) {
        return resp.render('solicitacoes', {resposta: "Erro ao recusar solicitação de amizade!"})
    }
});

app.post("/pedir_troca", async (req, resp) => {
    try {
        if(!req.body.jogoreceber || !req.body.jogoenviar){
            const amigo_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email_amigo}).toArray()
            const jogador_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email}).toArray()
            return resp.render("solicitar_troca.ejs", { resposta: "Não deixe campos em branco!", meusjogos: jogador_jogos, seusjogos: amigo_jogos });
        }
        const id_enviar = new ObjectId(req.body.jogoenviar);
        const id_receber = new ObjectId(req.body.jogoreceber);
        const verificar_pedido = await client.db("NightSKY").collection("Pedidos_Troca").findOne({ db_jogador: email, db_amigo: email_amigo, db_status: "Pendente", db_id_enviar: id_enviar, db_id_receber: id_receber });
        if(verificar_pedido != null) {
            const amigo_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email_amigo}).toArray()
            const jogador_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email}).toArray()
            return resp.render("solicitar_troca.ejs", { resposta: "Este pedido de troca já foi realizado anteriormente!", meusjogos: jogador_jogos, seusjogos: amigo_jogos });
        }
        const jogo_enviar = await client.db("NightSKY").collection("Jogos").findOne({
            _id: id_enviar
        });
        const jogo_receber = await client.db("NightSKY").collection("Jogos").findOne({
            _id: id_receber
        });
        await client.db("NightSKY").collection("Pedidos_Troca").insertOne({
            db_jogador: email, db_amigo: email_amigo, db_jogo_enviar: jogo_enviar.db_nome_jogo, db_id_enviar: id_enviar, db_jogo_receber: jogo_receber.db_nome_jogo, db_id_receber: id_receber, db_status: "Pendente"
        });
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        const nome_pendentes = []
        const nome_recebidas = []
        for(const amigo of solicitacoes_pendentes) {
            email_amigo = amigo.db_amigo
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_pendentes.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber});
        }
        for(const amigo of solicitacoes_recebidas) {
            email_amigo = amigo.db_jogador
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_recebidas.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber, emailamigo: email_amigo, _id: amigo._id, id_enviar: amigo.db_id_enviar, id_receber: amigo.db_id_receber});
        }
        return resp.render("pedidos_troca.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
    }
    catch (err) {
        console.log(err)
        const amigo_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email_amigo}).toArray()
        const jogador_jogos = await client.db("NightSKY").collection("Biblioteca").find({db_jogador: email}).toArray()
        return resp.render("solicitar_troca.ejs", { resposta: "Erro ao enviar solicitação de troca!", meusjogos: jogador_jogos, seusjogos: amigo_jogos });
    }
});

app.post("/aceitar_troca", async (req, resp) => {
    try {
        await client.db("NightSKY").collection("Pedidos_Troca").updateOne(
            {_id: new ObjectId(req.body.id)},
            {$set: {db_status: "Aceito"}}
        )
        const enviar = new ObjectId(req.body.id_jogo_enviar)
        const enviar_jogo = await client.db("NightSKY").collection("Jogos").findOne(
            {_id: enviar}
        )
        const receber = new ObjectId(req.body.id_jogo_receber)
        const receber_jogo = await client.db("NightSKY").collection("Jogos").findOne(
            {_id: receber}
        )
        const vai_receber = req.body.jogador_recebendo
        await client.db("NightSKY").collection("Biblioteca").updateOne(
            {db_jogador: email, db_jogo_id: receber},
            {$set: {db_jogo_id: enviar, db_nome_jogo: enviar_jogo.db_nome_jogo, db_imagem_jogo: enviar_jogo.db_imagem}}
        )
        await client.db("NightSKY").collection("Biblioteca").updateOne(
            {db_jogador: vai_receber, db_jogo_id: enviar},
            {$set: {db_jogo_id: receber, db_nome_jogo: receber_jogo.db_nome_jogo, db_imagem_jogo: receber_jogo.db_imagem}}
        )
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        const nome_pendentes = []
        const nome_recebidas = []
        for(const amigo of solicitacoes_pendentes) {
            email_amigo = amigo.db_amigo
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_pendentes.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber});
        }
        for(const amigo of solicitacoes_recebidas) {
            email_amigo = amigo.db_jogador
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_recebidas.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber, emailamigo: email_amigo, _id: amigo._id, id_enviar: amigo.db_id_enviar, id_receber: amigo.db_id_receber});
        }
        return resp.render("pedidos_troca.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
    }
    catch (err) {
        console.log(err)
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        return resp.render('pedidos_troca', {resposta: "Erro ao aceitar solicitação de troca!", pendentes: solicitacoes_pendentes, solicitacoes: solicitacoes_recebidas})
    }
});

app.post("/recusar_troca", async (req, resp) => {
    try {
        await client.db("NightSKY").collection("Pedidos_Troca").updateOne(
            {_id: new ObjectId(req.body.id)},
            {$set: {db_status: "Recusado"}}
        )
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        return resp.render("pedidos_troca.ejs", { resposta: "", pendentes: solicitacoes_pendentes, solicitacoes: solicitacoes_recebidas});
    }
    catch (err) {
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        return resp.render('pedidos_troca', {resposta: "Erro ao recusar solicitação de troca!", pendentes: solicitacoes_pendentes, solicitacoes: solicitacoes_recebidas})
    }
});

app.post("/editar_jogo", async (req, resp) => {
    try {
        if(req.body.nome_jogo == "" || req.body.descricao == "" || req.body.dev == "" || !req.body.categoria || req.body.preco == ""){
            const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
            return resp.render('editar_jogo', {resposta: "Não deixe campos em branco!", devs})
        }
        const verificar_jogo = await client.db("NightSKY").collection("Jogos").findOne({ db_nome_jogo: req.body.nome_jogo, db_publisher: email });
        if(verificar_jogo != null){
            const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
            return resp.render('cadastro_jogo', {resposta: "Jogo com esse nome já cadastrado pela publisher!", devs})
        }

        await client.db("NightSKY").collection("Jogos").updateOne(
            {_id: new ObjectId(req.body.id)},
            {$set: {db_nome_jogo: req.body.nome_jogo, db_descricao: req.body.descricao, db_dev: req.body.dev, db_categoria: req.body.categoria, db_publisher: email, db_preço: req.body.preco, db_imagem: req.body.imagem_jogo}}
        )
        await client.db("NightSKY").collection("Biblioteca").updateMany(
            { db_jogo_id: new ObjectId(req.body.id) },
            { $set: {db_jogo_nome: req.body.nome_jogo, db_jogo_imagem: req.body.imagem_jogo}}
        );
        const total_jogos =  await client.db("NightSKY").collection("Jogos").countDocuments({db_publisher: email})
        const meus_jogos = await client.db("NightSKY").collection("Jogos").find({db_publisher: email}).toArray()
        return resp.render("total_jogos.ejs", {cadastrojogo: "Cadastrar novo jogo", resposta: total_jogos, meusjogos: meus_jogos});
    }
    catch (err) {
        const devs = await client.db("NightSKY").collection('Usuário').find({ db_tipo_conta: 'Dev' }).toArray();
        return resp.render('editar_jogo.ejs', {resposta: "Erro ao editar informações do jogo!", devs})
    }
});

app.post("/recusar_troca", async (req, resp) => {
    try {
        await client.db("NightSKY").collection("Pedidos_Troca").updateOne(
            {_id: new ObjectId(req.body.id)},
            {$set: {db_status: "Recusado"}}
        )
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        const nome_pendentes = []
        const nome_recebidas = []
        for(const amigo of solicitacoes_pendentes) {
            email_amigo = amigo.db_amigo
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_pendentes.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber});
        }
        for(const amigo of solicitacoes_recebidas) {
            email_amigo = amigo.db_jogador
            const amigo_jogador = await client.db("NightSKY").collection("Usuário").findOne({ db_email: email_amigo })
            let nome_amigo;
            if (amigo_jogador) {
                nome_amigo = amigo_jogador.db_nome;
            }
            nome_recebidas.push({nome: nome_amigo, jogo_enviar: amigo.db_jogo_enviar, jogo_receber: amigo.db_jogo_receber, emailamigo: email_amigo, _id: amigo._id, id_enviar: amigo.db_id_enviar, id_receber: amigo.db_id_receber});
        }
        return resp.render("pedidos_troca.ejs", { resposta: "", pendentes: nome_pendentes, solicitacoes: nome_recebidas});
    }
    catch (err) {
        const solicitacoes_pendentes = await client.db("NightSKY").collection("Pedidos_Troca").find({db_jogador: email, db_status: "Pendente"}).toArray()
        const solicitacoes_recebidas = await client.db("NightSKY").collection("Pedidos_Troca").find({db_amigo: email, db_status: "Pendente"}).toArray()
        return resp.render('pedidos_troca', {resposta: "Erro ao recusar solicitação de troca!", pendentes: solicitacoes_pendentes, solicitacoes: solicitacoes_recebidas})
    }
});

startServer();
