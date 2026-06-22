<?php
header("Content-Type: application/json");

require_once __DIR__ . "/../API/config.php";
require_once __DIR__ . "/sessao.php";

sessao::iniciar();

if (!sessao::tokenValido($conn) || $_SESSION['usuario_perfil'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["erro" => "Acesso negado"]);
    exit;
}

$abrev = [1 => 'Jan', 2 => 'Fev', 3 => 'Mar', 4 => 'Abr', 5 => 'Mai', 6 => 'Jun',
          7 => 'Jul', 8 => 'Ago', 9 => 'Set', 10 => 'Out', 11 => 'Nov', 12 => 'Dez'];

$ano = (int) date('Y');

// Base de cálculo: pedidos PAGOS e que NÃO foram cancelados/recusados.
// (um pedido pago e depois cancelado não entra.)
// Mostra apenas os meses do ano atual que tiveram registro.
$sql = "SELECT DATE_FORMAT(p.data_pedido, '%Y-%m')                       AS ym,
        ip.nome_produto                                                  AS sabor,
        SUM(ip.quantidade)                                               AS quantidade,
        SUM(ip.quantidade * ip.preco)                                    AS bruto,
        SUM(ip.quantidade * COALESCE(pr.preco_producao, 0))             AS custos
    FROM pedidos p
    JOIN itens_pedido ip ON ip.pedido_id = p.id
    LEFT JOIN produtos pr ON pr.id = ip.produto_id
    WHERE p.pago = 1
      AND p.status NOT IN ('cancelado', 'recusado')
      AND YEAR(p.data_pedido) = ?
    GROUP BY ym, ip.nome_produto
    ORDER BY ym ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $ano);
$stmt->execute();
$res = $stmt->get_result();

$linhas = [];
$mesesMap = [];   // ym => label, só os meses que realmente têm registro
while ($row = $res->fetch_assoc()) {
    $linhas[] = [
        'ym'         => $row['ym'],
        'sabor'      => $row['sabor'],
        'quantidade' => (int) $row['quantidade'],
        'bruto'      => (float) $row['bruto'],
        'custos'     => (float) $row['custos'],
    ];

    if (!isset($mesesMap[$row['ym']])) {
        $mesesMap[$row['ym']] = $abrev[(int) substr($row['ym'], 5, 2)];
    }
}

ksort($mesesMap);   // ordem cronológica (ym no formato YYYY-MM ordena corretamente)

$meses = [];
foreach ($mesesMap as $ym => $label) {
    $meses[] = ['ym' => $ym, 'label' => $label];
}

echo json_encode([
    'meses'  => $meses,
    'linhas' => $linhas,
]);
