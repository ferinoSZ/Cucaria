<?php
header("Content-Type: application/json");

require_once __DIR__ . "/../API/env.php";

$origemPermitida = env('ALLOWED_ORIGIN', '');
if ($origemPermitida !== '' && isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $origemPermitida) {
    header("Access-Control-Allow-Origin: $origemPermitida");
    header("Access-Control-Allow-Credentials: true");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../API/config.php");
require_once("../API/produto.php");
require_once("../back-end/sessao.php");

sessao::iniciar();
$isAdmin = isset($_SESSION['usuario_perfil']) && $_SESSION['usuario_perfil'] === 'admin';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    case 'GET':
        $produtos = Produto::listarTodos($conn, false);
        echo json_encode($produtos);
        break;

    case 'POST':
        if (isset($_FILES['imagem']) && isset($_POST['acao']) && $_POST['acao'] === 'uploadImagem') {
            $pasta = "../front-end/img/produtos/";

            if (!is_dir($pasta)) {
                mkdir($pasta, 0777, true);
            }

            $ext          = strtolower(pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION));
            $permitidos   = ['jpg', 'jpeg', 'png', 'webp'];

            if (!in_array($ext, $permitidos)) {
                echo json_encode(["erro" => "Formato de imagem inválido."]);
                exit;
            }

            $nomeArquivo    = uniqid("produto_") . "." . $ext;
            $caminhoCompleto = $pasta . $nomeArquivo;

            if (move_uploaded_file($_FILES['imagem']['tmp_name'], $caminhoCompleto)) {
                echo json_encode(["imagem_url" => "img/produtos/" . $nomeArquivo]);
            } else {
                echo json_encode(["erro" => "Falha ao mover arquivo."]);
            }
            exit;
        }

        if ($input && isset($input['acao']) && $input['acao'] === 'excluir') {
            $ok = Produto::excluir($conn, $input['id']);
            echo json_encode(["success" => $ok]);
            exit;
        }

        if ($input && isset($input['acao']) && $input['acao'] === 'mudarStatus') {
            $id     = $input['id']     ?? null;
            $status = $input['status'] ?? null;

            if ($id === null || $status === null) {
                echo json_encode(["sucesso" => false, "mensagem" => "Dados inválidos"]);
                exit;
            }

            $resultado = Produto::mudarStatus($conn, $id, $status);
            echo json_encode(["sucesso" => $resultado]);
            exit;
        }

        $nome          = $_POST['nome']          ?? '';
        $preco_venda   = $_POST['preco_venda']   ?? 0;
        $preco_producao = $_POST['preco_producao'] ?? 0;
        $descricao     = $_POST['descricao']     ?? '';
        $imagem_url    = '';

        if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === 0) {
            $pasta     = "../front-end/img/produtos/";
            $ext       = strtolower(pathinfo($_FILES['imagem']['name'], PATHINFO_EXTENSION));
            $nomeArq   = uniqid("produto_") . "." . $ext;
            $caminho   = $pasta . $nomeArq;

            if (!is_dir($pasta)) {
                mkdir($pasta, 0777, true);
            }

            move_uploaded_file($_FILES['imagem']['tmp_name'], $caminho);
            $imagem_url = "img/produtos/" . $nomeArq;
        }

        $ok = Produto::cadastrar($conn, $nome, $preco_venda, $preco_producao, $descricao, $imagem_url);
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
        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(["success" => false]); exit; }
        $ok = Produto::excluir($conn, $id);
        echo json_encode(["success" => $ok]);
        break;
}