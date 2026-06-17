<?php

class RateLimiter {
    const MAX_TENTATIVAS = 5;
    const JANELA_SEGUNDOS = 900; // 15 minutos

    private static function caminhoArquivo($chave) {
        $pasta = sys_get_temp_dir() . '/cucaria_rate_limit';
        if (!is_dir($pasta)) {
            mkdir($pasta, 0700, true);
        }
        return $pasta . '/' . md5($chave) . '.json';
    }

    private static function ler($chave) {
        $arquivo = self::caminhoArquivo($chave);
        if (!file_exists($arquivo)) {
            return ['tentativas' => 0, 'inicio' => time()];
        }
        $dados = json_decode(file_get_contents($arquivo), true);
        if (!$dados || time() - $dados['inicio'] > self::JANELA_SEGUNDOS) {
            return ['tentativas' => 0, 'inicio' => time()];
        }
        return $dados;
    }

    private static function escrever($chave, $dados) {
        file_put_contents(self::caminhoArquivo($chave), json_encode($dados));
    }

    public static function bloqueado($chave) {
        $dados = self::ler($chave);
        return $dados['tentativas'] >= self::MAX_TENTATIVAS;
    }

    public static function registrarFalha($chave) {
        $dados = self::ler($chave);
        $dados['tentativas']++;
        self::escrever($chave, $dados);
    }

    public static function limpar($chave) {
        $arquivo = self::caminhoArquivo($chave);
        if (file_exists($arquivo)) {
            unlink($arquivo);
        }
    }
}
