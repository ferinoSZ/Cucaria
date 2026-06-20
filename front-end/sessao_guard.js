function tratarSessaoExpirada(resposta) {
    if (resposta.status === 401 || resposta.status === 403) {
        alert('Sua sessão foi encerrada (a conta foi acessada em outro dispositivo). Faça login novamente.');
        window.location.href = 'login.html';
        return true;
    }
    return false;
}
