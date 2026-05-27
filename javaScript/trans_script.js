const materiais = [
    { id: 'frascos', label: 'Frascos' },
    { id: 'tampas', label: 'Tampas' },
    { id: 'seringa', label: 'Seringa' },
    { id: 'copo', label: 'Copo' },
    { id: 'rotulo', label: 'Rótulo' },
    { id: 'cartucho', label: 'Cartucho' },
    { id: 'bula', label: 'Bula' },
    { id: 'caixa', label: 'Caixa' },
    { id: 'cola', label: 'Cola' },
    { id: 'pallet', label: 'Pallet' }
];

function switchTab(tabId, event) {

    document.querySelectorAll('.tab-btn')
        .forEach(btn => btn.classList.remove('active'));

    document.querySelectorAll('.tab-content')
        .forEach(content => content.classList.remove('active'));

    const currentEvent = event || window.event;

    if (currentEvent && currentEvent.currentTarget) {
        currentEvent.currentTarget.classList.add('active');
    }

    document
        .getElementById(`tab-${tabId}`)
        .classList.add('active');

    if (tabId === 'historico') {
        loadHistory();
    }
}

function getActiveMaterials() {

    const useSeringa =
        document.getElementById('use_seringa')?.checked;

    const useCopo =
        document.getElementById('use_copo')?.checked;

    return materiais.filter(mat => {

        if (mat.id === 'seringa' && !useSeringa) {
            return false;
        }

        if (mat.id === 'copo' && !useCopo) {
            return false;
        }

        return true;
    });
}

function renderTable() {

    const tbody =
        document.getElementById('table-body');

    if (!tbody) return;

    tbody.innerHTML = '';

    const materiaisAtivos =
        getActiveMaterials();

    materiaisAtivos.forEach(mat => {

        const tr =
            document.createElement('tr');

        tr.innerHTML = `
            <td>
                <strong>${mat.label}</strong>
            </td>

            <td>
                <input
                    type="text"
                    id="${mat.id}_ordem_origem"
                    placeholder="..."
                >
            </td>

            <td>
                <input
                    type="number"
                    id="${mat.id}_qtd_recebida"
                    placeholder="0"
                >
            </td>

            <td>
                <input
                    type="text"
                    id="${mat.id}_ordem_destino"
                    placeholder="..."
                >
            </td>

            <td>
                <input
                    type="text"
                    id="${mat.id}_lote_mat"
                    placeholder="..."
                >
            </td>

            <td>
                <input
                    type="number"
                    id="${mat.id}_qtd_transferida"
                    placeholder="0"
                >
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function clearCurrentTable() {

    if (!confirm('Deseja limpar todos os campos da tabela atual?')) {
        return;
    }

    const materiaisAtivos =
        getActiveMaterials();

    materiaisAtivos.forEach(mat => {

        const ids = [
            'ordem_origem',
            'qtd_recebida',
            'ordem_destino',
            'lote_mat',
            'qtd_transferida'
        ];

        ids.forEach(suffix => {

            const el =
                document.getElementById(`${mat.id}_${suffix}`);

            if (el) {
                el.value = '';
            }
        });
    });

    alert('Tabela limpa!');
}

// ========================================
// APAGAR HISTÓRICO COM SENHA
// ========================================

async function clearAllHistory() {

    const senha = prompt('Digite a senha para apagar o histórico:');

    if (senha !== 'admin123') {
        alert('Senha incorreta');
        return;
    }

    const confirmar = confirm('Tem certeza que deseja apagar TUDO?');

    if (!confirmar) return;

    try {

        const response = await fetch(
            'http://localhost:3000/transferencias/apagar',
            {
                method: 'DELETE'
            }
        );

        const result = await response.json();

        if (result.success) {

            alert('Histórico apagado com sucesso!');
            loadHistory();

        } else {

            alert(result.message || 'Erro ao apagar');
        }

    } catch (err) {

        console.log(err);
        alert('Erro ao conectar com servidor');
    }
}

async function finalizeTransfers() {

    const fieldLote =
        document.getElementById('lote_atual');

    const fieldOrdem =
        document.getElementById('ordem_atual');

    const lote =
        fieldLote.value.trim();

    const ordem =
        fieldOrdem.value.trim();

    if (!lote || !ordem) {

        alert(
            'Preencha Lote de Trabalho e Ordem de Trabalho.'
        );

        return;
    }

    const entradas = [];

    const saidas = [];

    getActiveMaterials().forEach(mat => {

        const qtdRecebida =
            parseFloat(
                document.getElementById(`${mat.id}_qtd_recebida`).value
            ) || 0;

        const qtdTransferida =
            parseFloat(
                document.getElementById(`${mat.id}_qtd_transferida`).value
            ) || 0;

        // =========================
        // ENTRADAS
        // =========================

        if (qtdRecebida > 0) {

            entradas.push({

                material: mat.label,

                ordem_origem:
                    document.getElementById(`${mat.id}_ordem_origem`)
                    .value
                    .trim() || '',

                quantidade: qtdRecebida
            });
        }

        // =========================
        // SAÍDAS
        // =========================

        if (qtdTransferida > 0) {

            saidas.push({

                material: mat.label,

                ordem_destino:
                    document.getElementById(`${mat.id}_ordem_destino`)
                    .value
                    .trim() || '',

                lote_material:
                    document.getElementById(`${mat.id}_lote_mat`)
                    .value
                    .trim() || '',

                quantidade: qtdTransferida
            });
        }
    });

    if (entradas.length === 0 && saidas.length === 0) {

        alert(
            'Insira ao menos uma movimentação.'
        );

        return;
    }

    try {

        const response = await fetch(
            'http://localhost:3000/transferencias',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    lote,
                    ordem,
                    entradas,
                    saidas
                })
            }
        );

        const result =
            await response.json();

        if (result.success) {

            alert(
                'Movimentações salvas com sucesso!'
            );

            fieldLote.value = '';

            fieldOrdem.value = '';

            renderTable();

            loadHistory();

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            setTimeout(() => {
                fieldLote.focus();
            }, 500);

        } else {

            alert(
                result.message || 'Erro ao salvar.'
            );
        }

    } catch (err) {

        console.log(err);

        alert(
            'Erro ao conectar com servidor.'
        );
    }
}

async function loadHistory() {

    const container =
        document.getElementById('history-container');

    if (!container) return;

    container.innerHTML = 'Carregando...';

    try {

        const response =
            await fetch(
                'http://localhost:3000/transferencias'
            );

        const historico =
            await response.json();

        container.innerHTML = '';

        if (!historico.length) {

            container.innerHTML = `
                <div class="empty-history">
                    Nenhuma transferência registrada.
                </div>
            `;

            return;
        }

        historico.forEach(reg => {

            const card =
                document.createElement('div');

            card.className = 'history-card';

            let linhasEntrada = '';

            if (reg.entradas.length > 0) {

                reg.entradas.forEach(e => {

                    linhasEntrada += `
                        <tr>
                            <td>${e.material}</td>
                            <td>${e.ordem_origem}</td>
                            <td>${e.quantidade}</td>
                        </tr>
                    `;
                });

            } else {

                linhasEntrada = `
                    <tr>
                        <td colspan="3">
                            Nenhuma entrada
                        </td>
                    </tr>
                `;
            }

            let linhasSaida = '';

            if (reg.saidas.length > 0) {

                reg.saidas.forEach(s => {

                    linhasSaida += `
                        <tr>
                            <td>${s.material}</td>
                            <td>${s.ordem_destino}</td>
                            <td>${s.lote_material}</td>
                            <td>${s.quantidade}</td>
                        </tr>
                    `;
                });

            } else {

                linhasSaida = `
                    <tr>
                        <td colspan="4">
                            Nenhuma saída
                        </td>
                    </tr>
                `;
            }

            card.innerHTML = `
                <div class="history-header">

                    <div>

                        <strong>Lote:</strong>
                        ${reg.lote}

                        |

                        <strong>Ordem:</strong>
                        ${reg.ordem}

                        <br>

                        <small>
                            ${reg.mes_ano || ''}
                        </small>

                    </div>

                </div>

                <div class="history-tables-wrapper">

                    <div class="history-table-box">

                        <h4>
                            📥 Entradas
                        </h4>

                        <table class="mini-table">

                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th>Origem</th>
                                    <th>Qtd</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${linhasEntrada}
                            </tbody>

                        </table>

                    </div>

                    <div class="history-table-box">

                        <h4>
                            📤 Saídas
                        </h4>

                        <table class="mini-table">

                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th>Destino</th>
                                    <th>Lote</th>
                                    <th>Qtd</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${linhasSaida}
                            </tbody>

                        </table>

                    </div>

                </div>
            `;

            container.appendChild(card);
        });

    } catch (err) {

        console.log(err);

        container.innerHTML = `
            <div class="empty-history">
                Erro ao carregar histórico.
            </div>
        `;
    }
}

window.onload = function () {

    renderTable();

    loadHistory();
};