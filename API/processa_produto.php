<?php

require_once '../API/config.php';
require_once '../API/produto.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = trim($_POST['nome']);
    $descricao = trim($_POST['descricao']); 
    $preco_venda = filter_var($_POST['preco'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $preco_producao = filter_var($_POST['preco_producao'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $imagem_url = null;
    $diretorio_destino = "../front-end/img/produtos/"; 
    
    if (!is_dir($diretorio_destino)) {
        mkdir($diretorio_destino, 0777, true);
    }

    if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
        header("Location: ../front-end/cadastro_itens.html?erro=imagem_obrigatoria");
        exit();
    }

    $nome_arquivo_original = $_FILES['imagem']['name'];
    $extensao = strtolower(pathinfo($nome_arquivo_original, PATHINFO_EXTENSION));
    $extensoes_permitidas = ['jpg', 'jpeg', 'png', 'webp'];

    if (in_array($extensao, $extensoes_permitidas)) {
        $novo_nome_imagem = uniqid("produto_") . "." . $extensao;
        $caminho_completo = $diretorio_destino . $novo_nome_imagem;

        if (move_uploaded_file($_FILES['imagem']['tmp_name'], $caminho_completo)) {
            $imagem_url = "img/produtos/" . $novo_nome_imagem; 
        } else {
            header("Location: ../front-end/cadastro_itens.html?erro=falha_upload");
            exit();
        }
    } else {
        header("Location: ../front-end/cadastro_itens.html?erro=formato_invalido");
        exit();
    }

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
