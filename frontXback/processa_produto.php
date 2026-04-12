<?php

require_once '../back-end/config.php';
require_once '../back-end/Produto.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Recebe e limpa os dados de texto do formulário
    $nome = trim($_POST['nome']);
    $descricao = trim($_POST['descricao']);
    
    // Filtra os preços para garantir que o banco entenda os números quebrados
    $preco_venda = filter_var($_POST['preco'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $preco_producao = filter_var($_POST['preco_producao'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

    // 2. Configurações de Upload de Imagem
    $imagem_url = null;
    $diretorio_destino = "../front-end/img/produtos/"; 
    
    // Se a pasta 'produtos' não existir dentro de 'img', o PHP cria ela automaticamente
    if (!is_dir($diretorio_destino)) {
        mkdir($diretorio_destino, 0777, true);
    }

   // 3. Processamento da Imagem (AGORA OBRIGATÓRIO)
    if (!isset($_FILES['imagem']) || $_FILES['imagem']['error'] !== UPLOAD_ERR_OK) {
        // Se não enviou imagem ou deu erro no upload da imagem, trava e devolve o erro
        header("Location: ../front-end/cadastro_itens.html?erro=imagem_obrigatoria");
        exit();
    }

    $nome_arquivo_original = $_FILES['imagem']['name'];
    $extensao = strtolower(pathinfo($nome_arquivo_original, PATHINFO_EXTENSION));
    
    // Regra de Segurança: Só permite extensões de imagem
    $extensoes_permitidas = ['jpg', 'jpeg', 'png', 'webp'];

    if (in_array($extensao, $extensoes_permitidas)) {
        // Gera um nome único e aleatório para a foto
        $novo_nome_imagem = uniqid("produto_") . "." . $extensao;
        $caminho_completo = $diretorio_destino . $novo_nome_imagem;

        // Move a foto temporária
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



    // 4. Salva no Banco de Dados usando o Model
    $sucesso = Produto::cadastrar($conn, $nome, $preco_venda, $preco_producao, $descricao, $imagem_url);

    if ($sucesso) {
        header("Location: ../front-end/cadastro_itens.html?sucesso=produto_cadastrado");
    } else {
        header("Location: ../front-end/cadastro_itens.html?erro=erro_banco");
    }
    exit();

} else {
    // Se alguém tentar acessar a URL direto sem enviar o form
    header("Location: ../front-end/cadastro_itens.html");
    exit();
}
