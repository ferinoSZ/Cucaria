(async () => {
    try {
        const resposta = await fetch('../back-end/sessao_status.php', { credentials: 'include' });
        const dados = await resposta.json();

        if (!dados.logado || dados.perfil !== 'admin') {
            window.location.replace('login.html');
        }
    } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.replace('login.html');
    }
})();
