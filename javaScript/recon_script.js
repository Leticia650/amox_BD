const materiais = [
    { id: 'frascos', label: 'Frascos', tol: 5.00 },
    { id: 'tampas', label: 'Tampas', tol: 5.00 },
    { id: 'seringa', label: 'Seringa', tol: 2.00 },
    { id: 'copo', label: 'Copo', tol: 2.00 },
    { id: 'rotulo', label: 'Rótulo', tol: 5.00 },
    { id: 'cartucho', label: 'Cartucho', tol: 2.00 },
    { id: 'bula', label: 'Bula', tol: 2.00 },
    { id: 'caixa', label: 'Caixa', tol: 2.00 },
    { id: 'fita', label: 'Fita', tol: 5.00 },
    { id: 'cola', label: 'Cola', tol: 0.00 },
    { id: 'pallet', label: 'Pallet', tol: 0.00 },
    { id: 'etiqueta_90x130', label: 'Etiqueta 90x130mm', tol: 2.00 },
    { id: 'etiqueta_70x10', label: 'Etiqueta 70x10mm', tol: 2.00 },
    { id: 'filme', label: 'Filme', tol: 0.00 },
    { id: 'cantoneira_100', label: 'Cantoneira 1,00mt', tol: 0.00 },
    { id: 'cantoneira_120', label: 'Cantoneira 1,20mt', tol: 0.00 }
];

const atributos = [
    { id: 'A', label: 'A: quantidade recebida', type: 'number' },
    { id: 'A1', label: 'A1: requisição de material', type: 'number' },
    { id: 'A2', label: 'A2: quantidade recebida (transferência, lote anterior)', type: 'number' },
    { id: 'ordem_transf_ant', label: 'Nº da ordem da transferência(lote anterior)', type: 'text' },
    { id: 'A3', label: 'A3: quantidade total recebida(A+A1+A2)', type: 'calc' },
    { id: 'qtd_transf_prox', label: 'Quantidade para transferir (prox lote)', type: 'number' },
    { id: 'ordem_receber_transf', label: 'Nº da ordem a receber a transferência', type: 'text' },
    { id: 'lote_transf', label: 'Lote do material a ser transferido', type: 'text' },
    { id: 'devolvido', label: 'Devolvido', type: 'number' },
    { id: 'total_utilizado', label: 'Total utilizado(consumo)', type: 'number' },
    { id: 'B', label: 'B: refugo', type: 'calc' },
    { id: 'calc_refugo', label: 'Cálculo do refugo (B : A3) x 100', type: 'pct' }
];

function roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

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

function renderTable() {

    const tbody = document.getElementById('table-body');

    tbody.innerHTML = '';

    atributos.forEach(attr => {

        const tr = document.createElement('tr');

        const tdLabel = document.createElement('td');

        tdLabel.textContent = attr.label;

        tr.appendChild(tdLabel);

        materiais.forEach(mat => {

            const td = document.createElement('td');

            td.setAttribute('data-mat', mat.id);

            if (attr.type === 'number') {

                const input = document.createElement('input');

                input.type = 'number';

                input.id = `${mat.id}_${attr.id}`;

                input.placeholder = 'Digite...';

                input.oninput = calculateValues;

                td.appendChild(input);

            } else if (attr.type === 'text') {

                const input = document.createElement('input');

                input.type = 'text';

                input.id = `${mat.id}_${attr.id}`;

                input.placeholder = 'Digite...';

                td.appendChild(input);

            } else if (attr.type === 'calc') {

                td.innerHTML = `
                    <span
                        id="${mat.id}_${attr.id}"
                        class="calculated-value"
                    >
                        0
                    </span>
                `;

            } else if (attr.type === 'pct') {

                td.innerHTML = `
                    <span
                        id="${mat.id}_${attr.id}"
                        class="status-ok"
                    >
                        0,00%
                    </span>
                `;
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    materiais.forEach(mat => {

        const cb =
            document.getElementById(`toggle-${mat.id}`);

        if (cb && !cb.checked) {
            toggleColumn(mat.id);
        }
    });
}

function clearCurrentTable() {

    if (!confirm('Deseja limpar a tabela atual?')) {
        return;
    }

    materiais.forEach(mat => {

        atributos.forEach(attr => {

            const el =
                document.getElementById(`${mat.id}_${attr.id}`);

            if (!el) return;

            if (el.tagName === 'INPUT') {

                el.value = '';

            } else if (attr.type === 'calc') {

                el.textContent = '0';

            } else if (attr.type === 'pct') {

                el.textContent = '0,00%';

                el.className = 'status-ok';
            }
        });
    });

    calculateValues();

    alert('Tabela limpa!');
}

function calculateValues() {

    materiais.forEach(mat => {

        const valA =
            parseFloat(
                document.getElementById(`${mat.id}_A`)?.value
            ) || 0;

        const valA1 =
            parseFloat(
                document.getElementById(`${mat.id}_A1`)?.value
            ) || 0;

        const valA2 =
            parseFloat(
                document.getElementById(`${mat.id}_A2`)?.value
            ) || 0;

        const valDevolvido =
            parseFloat(
                document.getElementById(`${mat.id}_devolvido`)?.value
            ) || 0;

        const valTransfProx =
            parseFloat(
                document.getElementById(`${mat.id}_qtd_transf_prox`)?.value
            ) || 0;

        const valUtilizado =
            parseFloat(
                document.getElementById(`${mat.id}_total_utilizado`)?.value
            ) || 0;

        const totalA3 =
            valA + valA1 + valA2;

        document.getElementById(`${mat.id}_A3`)
            .textContent = totalA3;

        const refugo =
            Math.max(
                0,
                totalA3
                - valTransfProx
                - valDevolvido
                - valUtilizado
            );

        document.getElementById(`${mat.id}_B`)
            .textContent = refugo;

        const pctElement =
            document.getElementById(`${mat.id}_calc_refugo`);

        if (totalA3 === 0) {

            pctElement.textContent = '0,00%';

            pctElement.className = 'status-ok';

        } else {

            const pct =
                roundToTwo((refugo / totalA3) * 100);

            pctElement.textContent =
                pct.toFixed(2).replace('.', ',') + '%';

            pctElement.className =
                pct <= mat.tol
                    ? 'status-ok'
                    : 'status-error';
        }
    });
}

async function clearAllHistory() {

    const senha = prompt(
        'Digite a senha para apagar o histórico:'
    );

    const senhaCorreta = 'admin123';

    if (senha !== senhaCorreta) {

        alert('Senha incorreta.');

        return;
    }

    const confirmar = confirm(
        'ATENÇÃO: Deseja realmente apagar TODO o histórico?'
    );

    if (!confirmar) {
        return;
    }

    try {

        const response = await fetch(
            'http://localhost:3000/lotes/apagar',
            {
                method: 'DELETE'
            }
        );

        const result = await response.json();

        if (result.success) {

            alert('Histórico apagado com sucesso!');

            loadHistory();

        } else {

            alert('Erro ao apagar histórico.');
        }

    } catch (err) {

        console.log(err);

        alert('Erro ao conectar com servidor.');
    }
}

function toggleColumn(matId) {

    const checkbox =
        document.getElementById(`toggle-${matId}`);

    document
        .querySelectorAll(`[data-mat="${matId}"]`)
        .forEach(el => {

            if (!checkbox || checkbox.checked) {

                el.classList.remove('hidden-col');

            } else {

                el.classList.add('hidden-col');
            }
        });
}

async function finalizeBatch() {

    const fieldLote =
        document.getElementById('lote_atual');

    const fieldOrdem =
        document.getElementById('ordem_atual');

    const lote = fieldLote.value.trim();

    const ordem = fieldOrdem.value.trim();

    if (!lote) {
        alert('Informe o lote.');
        fieldLote.focus();
        return;
    }

    if (!ordem) {
        alert('Informe a ordem.');
        fieldOrdem.focus();
        return;
    }

    const dadosMateriais = [];

    const transferenciasEnviadas = [];

    const transferenciasRecebidas = [];

    for (const mat of materiais) {

        const totalA3 =
            parseFloat(
                document.getElementById(`${mat.id}_A3`).textContent
            ) || 0;

        const refugoB =
            parseFloat(
                document.getElementById(`${mat.id}_B`).textContent
            ) || 0;

        const percentual =
            document
                .getElementById(`${mat.id}_calc_refugo`)
                .textContent
                .replace('%', '')
                .replace(',', '.');

        const status =
            document
                .getElementById(`${mat.id}_calc_refugo`)
                .className;

        dadosMateriais.push({

            material_id: mat.id,

            material_nome: mat.label,

            total_a3: totalA3,

            refugo_b: refugoB,

            percentual_refugo: parseFloat(percentual) || 0,

            status_class: status
        });

        const qtdTransf =
            parseFloat(
                document.getElementById(`${mat.id}_qtd_transf_prox`).value
            ) || 0;

        if (qtdTransf > 0) {

            transferenciasEnviadas.push({

                material: mat.label,

                quantidade: qtdTransf,

                ordem_destino:
                    document.getElementById(`${mat.id}_ordem_receber_transf`).value || '',

                lote_material:
                    document.getElementById(`${mat.id}_lote_transf`).value || ''
            });
        }

        const qtdRecebida =
            parseFloat(
                document.getElementById(`${mat.id}_A2`).value
            ) || 0;

        if (qtdRecebida > 0) {

            transferenciasRecebidas.push({

                material: mat.label,

                quantidade: qtdRecebida,

                ordem_origem:
                    document.getElementById(`${mat.id}_ordem_transf_ant`).value || ''
            });
        }
    }

    try {

        const response = await fetch(
            'http://localhost:3000/lotes',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    lote,
                    ordem,
                    materiais: dadosMateriais,
                    transferencias: transferenciasEnviadas,
                    recebidos: transferenciasRecebidas
                })
            }
        );

        const result = await response.json();

        if (result.success) {

            alert('Lote salvo com sucesso!');

            fieldLote.value = '';

            fieldOrdem.value = '';

            renderTable();

            calculateValues();

        } else {

            alert(result.message || 'Erro ao salvar.');
        }

    } catch (err) {

        console.log(err);

        alert('Erro ao salvar lote.');
    }
}

async function loadHistory() {

    const container =
        document.getElementById('history-container');

    container.innerHTML = 'Carregando...';

    try {

        const response =
            await fetch('http://localhost:3000/lotes');

        const historico =
            await response.json();

        container.innerHTML = '';

        if (!historico.length) {

            container.innerHTML =
                '<div class="empty-history">Nenhum lote encontrado.</div>';

            return;
        }

        historico.forEach(reg => {

            const card =
                document.createElement('div');

            card.className = 'history-card';

            let tabela = `
                <table style="width:100%; margin-top:10px;">
                    <thead>
                        <tr>
                            <th>Material</th>
                            <th>Total Recebido</th>
                            <th>Refugo</th>
                            <th>% Refugo</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            reg.materiais.forEach(mat => {

                tabela += `
                    <tr>
                        <td>${mat.material_nome}</td>
                        <td>${mat.total_a3}</td>
                        <td>${mat.refugo_b}</td>
                        <td>${mat.percentual_refugo}%</td>
                    </tr>
                `;
            });

            tabela += `
                    </tbody>
                </table>
            `;

            card.innerHTML = `
                <div class="history-header">

                    <h3>
                        Lote: ${reg.lote}
                    </h3>

                    <p>
                        Ordem: ${reg.ordem}
                    </p>

                    <p>
                        Mês: ${reg.mes_ano}
                    </p>

                </div>

                ${tabela}
            `;

            container.appendChild(card);
        });

    } catch (err) {

        console.log(err);

        container.innerHTML =
            '<div class="empty-history">Erro ao carregar histórico.</div>';
    }
}

window.onload = function () {

    renderTable();

    calculateValues();
};