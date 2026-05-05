<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../API/config.php");
require_once("../API/produto.php");

$method = $_SERVER['REQUEST_METHOD'];

// Pega dados do body (JSON)
$input = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    case 'GET':
        $produtos = Produto::listarTodos($conn, true);
        echo json_encode($produtos);
        break;

    case 'POST':
        $nome = $_POST['nome'] ?? '';
        $preco_venda = $_POST['preco_venda'] ?? 0;
        $preco_producao = $_POST['preco_producao'] ?? 0;
        $descricao = $_POST['descricao'] ?? '';

        $imagem_url = "";

        if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === 0) {

            $pasta = "../front-end/img/produtos/";

            $ext = pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION);
            $nomeArquivo = uniqid("produto_") . "." . $ext;

            $caminhoCompleto = $pasta . $nomeArquivo;

            move_uploaded_file($_FILES['imagem']['tmp_name'], $caminhoCompleto);

            $imagem_url = "img/produtos/" . $nomeArquivo;
        }

        $ok = Produto::cadastrar(
            $conn,
            $nome,
            $preco_venda,
            $preco_producao,
            $descricao,
            $imagem_url
        );

        echo json_encode(["success" => $ok]);
        break;

    case 'PUT':
        $ok = Produto::editar(
            $conn,
            $input['id'],
            $input['nome'],
            $input['preco_venda'],
            $input['preco_producao'],
            $input['descricao'],
            $input['imagem_url']
        );

        echo json_encode(["success" => $ok]);
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $ok = Produto::excluir($conn, $id);

        echo json_encode(["success" => $ok]);
        break;
}