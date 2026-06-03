<?php

class Telegram {

    private static $token   = '';
    private static $chat_id = '-5211488063';

    public static function enviarMensagem($texto) {
        $url = "https://api.telegram.org/bot" . self::$token . "/sendMessage";

        $params = http_build_query([
            'chat_id'    => self::$chat_id,
            'text'       => $texto,
            'parse_mode' => 'Markdown'
        ]);

        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => 'Content-Type: application/x-www-form-urlencoded',
                'content' => $params,
                'timeout' => 10
            ]
        ]);

        $response = file_get_contents($url, false, $context);
        return json_decode($response, true);
    }

    public static function notificarNovoPedido($numero, $total, $itens) {
        $mensagem  = "🛒 *Novo Pedido {$numero}*\n";
        $mensagem .= "━━━━━━━━━━━━━━━\n";

        foreach ($itens as $item) {
            $nome  = $item['nome']       ?? $item['nome_produto'] ?? '—';
            $qtd   = $item['quantidade'];
            $preco = number_format($item['preco'], 2, ',', '.');
            $mensagem .= "• {$nome} x{$qtd} — R$ {$preco}\n";
        }

        $mensagem .= "━━━━━━━━━━━━━━━\n";
        $mensagem .= "💰 *Total: R$ " . number_format($total, 2, ',', '.') . "*";

        return self::enviarMensagem($mensagem);
    }
}