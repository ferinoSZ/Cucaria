<?php

require_once '../API/config.php';
require_once '../API/produto.php';
require_once '../API/upload_imagem.php';
require_once '../back-end/sessao.php';

sessao::iniciar();
if (!isset($_SESSION['usuario_perfil']) || $_SESSION['usuario_perfil'] !== 'admin') {
    header("Location: ../front-end/login.html?erro=acesso_negado");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = trim($_POST['nome']);
    $descricao = trim($_POST['descricao']);
    $preco_venda = filter_var($_POST['preco'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $preco_producao = filter_var($_POST['preco_producao'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $diretorio_destino = "../front-end/img/produtos/";

    if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
        header("Location: ../front-end/cadastro_itens.html?erro=imagem_obrigatoria");
        exit();
    }

    $resultadoUpload = UploadImagem::salvar($_FILES['imagem'], $diretorio_destino);

    if (isset($resultadoUpload['erro'])) {
        header("Location: ../front-end/cadastro_itens.html?erro=formato_invalido");
        exit();
    }

    $imagem_url = "img/produtos/" . $resultadoUpload['nomeArquivo'];

    $sucesso = produto::cadastrar($conn, $nome, $preco_venda, $preco_producao, $descricao, $imagem_url);

    if ($sucesso) {
        header("Location: ../front-end/cadastro_itens.html?sucesso=produto_cadastrado");
    } else {
        header("Location: ../front-end/cadastro_itens.html?erro=erro_banco");
    }
    exit();

} else {
    header("Location: ../front-end/cadastro_itens.html");
    exit();
}
