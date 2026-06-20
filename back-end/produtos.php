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
require_once("../API/upload_imagem.php");
require_once("../back-end/sessao.php");

sessao::iniciar();
$isAdmin = sessao::tokenValido($conn) && $_SESSION['usuario_perfil'] === 'admin';

$method = $_SERVER['REQUEST_METHOD'];
$input  = json_decode(file_get_contents("php://input"), true);

switch ($method) {

    case 'GET':
        $produtos = Produto::listarTodos($conn, false);
        echo json_encode($produtos);
        break;

    case 'POST':
        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(["erro" => "Acesso negado"]);
            exit;
        }

        if (isset($_FILES['imagem']) && isset($_POST['acao']) && $_POST['acao'] === 'uploadImagem') {
            $resultado = UploadImagem::salvar($_FILES['imagem'], "../front-end/img/produtos/");

            if (isset($resultado['erro'])) {
                echo json_encode(["erro" => $resultado['erro']]);
            } else {
                echo json_encode(["imagem_url" => "img/produtos/" . $resultado['nomeArquivo']]);
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
        $categoria_id  = $_POST['categoria_id']  ?? null;
        $imagem_url    = '';

        if (empty($categoria_id)) {
            echo json_encode(["success" => false, "erro" => "Categoria é obrigatória."]);
            exit;
        }

        if (isset($_FILES['imagem']) && $_FILES['imagem']['error'] === UPLOAD_ERR_OK) {
            $resultado = UploadImagem::salvar($_FILES['imagem'], "../front-end/img/produtos/");

            if (isset($resultado['erro'])) {
                echo json_encode(["success" => false, "erro" => $resultado['erro']]);
                exit;
            }

            $imagem_url = "img/produtos/" . $resultado['nomeArquivo'];
        }

        $ok = Produto::cadastrar($conn, $nome, $preco_venda, $preco_producao, $descricao, $imagem_url, (int) $categoria_id);
        echo json_encode(["success" => $ok]);
        break;

    case 'PUT':
        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(["erro" => "Acesso negado"]);
            exit;
        }

        if (empty($input['categoria_id'])) {
            echo json_encode(["success" => false, "erro" => "Categoria é obrigatória."]);
            exit;
        }

        $ok = Produto::editar(
            $conn,
            $input['id'],
            $input['nome'],
            $input['preco_venda'],
            $input['preco_producao'],
            $input['descricao'],
            $input['imagem_url'],
            (int) $input['categoria_id']
        );
        echo json_encode(["success" => $ok]);
        break;

    case 'DELETE':
        if (!$isAdmin) {
            http_response_code(403);
            echo json_encode(["erro" => "Acesso negado"]);
            exit;
        }

        $id = $_GET['id'] ?? null;
        if (!$id) { echo json_encode(["success" => false]); exit; }
        $ok = Produto::excluir($conn, $id);
        echo json_encode(["success" => $ok]);
        break;
}