require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false
});

app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});


// ==========================
// BUSCAR LOTES
// ==========================

app.get('/lotes', async (req, res) => {

    try {

        const lotesResult = await pool.query(`
            SELECT *
            FROM lotes
            ORDER BY id DESC
        `);

        const lotes = lotesResult.rows;

        for(const lote of lotes){

            const materiais = await pool.query(`
                SELECT *
                FROM lote_materiais
                WHERE lote_id = $1
            `, [lote.id]);

            const transferencias = await pool.query(`
                SELECT *
                FROM transferencias_enviadas
                WHERE lote_id = $1
            `, [lote.id]);

            const recebidos = await pool.query(`
                SELECT *
                FROM transferencias_recebidas
                WHERE lote_id = $1
            `, [lote.id]);

            lote.materiais = materiais.rows;
            lote.transferencias = transferencias.rows;
            lote.recebidos = recebidos.rows;
        }

        res.json(lotes);

    } catch(err){

        console.log(err);

        res.status(500).json({
            erro: 'Erro ao carregar lotes'
        });
    }
});


// ==========================
// SALVAR LOTE
// ==========================

app.post('/lotes', async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        const {
            lote,
            ordem,
            materiais,
            transferencias,
            recebidos
        } = req.body;

        const agora = new Date();

        const meses = [
            "Janeiro","Fevereiro","Março","Abril",
            "Maio","Junho","Julho","Agosto",
            "Setembro","Outubro","Novembro","Dezembro"
        ];

        const mesAno =
            `${meses[agora.getMonth()]} de ${agora.getFullYear()}`;

        const loteResult = await client.query(
            `
            INSERT INTO lotes
            (lote, ordem, mes_ano)

            VALUES ($1, $2, $3)

            RETURNING id
            `,
            [lote, ordem, mesAno]
        );

        const loteId = loteResult.rows[0].id;

        // ==========================
        // MATERIAIS
        // ==========================

        for(const mat of materiais){

            await client.query(
                `
                INSERT INTO lote_materiais
                (
                    lote_id,
                    material_id,
                    material_nome,
                    total_a3,
                    refugo_b,
                    percentual_refugo,
                    status_class
                )

                VALUES ($1,$2,$3,$4,$5,$6,$7)
                `,
                [
                    loteId,
                    mat.material_id,
                    mat.material_nome,
                    mat.total_a3,
                    mat.refugo_b,
                    mat.percentual_refugo,
                    mat.status_class
                ]
            );
        }

        // ==========================
        // TRANSFERÊNCIAS ENVIADAS
        // ==========================

        for(const t of transferencias){

            await client.query(
                `
                INSERT INTO transferencias_enviadas
                (
                    lote_id,
                    material,
                    quantidade,
                    ordem_destino,
                    lote_material
                )

                VALUES ($1,$2,$3,$4,$5)
                `,
                [
                    loteId,
                    t.material,
                    t.quantidade,
                    t.ordem_destino,
                    t.lote_material
                ]
            );
        }

        // ==========================
        // TRANSFERÊNCIAS RECEBIDAS
        // ==========================

        for(const r of recebidos){

            await client.query(
                `
                INSERT INTO transferencias_recebidas
                (
                    lote_id,
                    material,
                    quantidade,
                    ordem_origem
                )

                VALUES ($1,$2,$3,$4)
                `,
                [
                    loteId,
                    r.material,
                    r.quantidade,
                    r.ordem_origem
                ]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Lote salvo com sucesso!'
        });

    } catch(err){

        await client.query('ROLLBACK');

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'Erro ao salvar'
        });

    } finally {

        client.release();
    }
});


// ==========================
// EXCLUIR LOTE
// ==========================

app.delete('/transferencias/apagar', async (req, res) => {

    try {

        console.log('DELETE chamado');

        await pool.query('DELETE FROM transferencias_enviadas');
        await pool.query('DELETE FROM transferencias_recebidas');

        res.json({ success: true });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'Erro ao apagar'
        });
    }
});


// ==========================
// INICIAR SERVIDOR
// ==========================
// ==========================
// APAGAR TODO HISTÓRICO
// ==========================

app.delete('/lotes/apagar', async (req, res) => {

    try {

        await pool.query('DELETE FROM lote_materiais');

        await pool.query('DELETE FROM transferencias_enviadas');

        await pool.query('DELETE FROM transferencias_recebidas');

        await pool.query('DELETE FROM lotes');

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

// ==========================
// APAGAR TODO HISTÓRICO
// ==========================

app.delete('/lotes/apagar', async (req, res) => {

    try {

        await pool.query('DELETE FROM lote_materiais');

        await pool.query('DELETE FROM transferencias_enviadas');

        await pool.query('DELETE FROM transferencias_recebidas');

        await pool.query('DELETE FROM lotes');

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });
    }
});

// ==========================
// SALVAR TRANSFERÊNCIAS
// ==========================

app.post('/transferencias', async (req, res) => {

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        const {
            loteContexto,
            ordemContexto,
            entradas,
            saidas
        } = req.body;

        const agora = new Date();

        const meses = [
            "Janeiro","Fevereiro","Março","Abril",
            "Maio","Junho","Julho","Agosto",
            "Setembro","Outubro","Novembro","Dezembro"
        ];

        const mesAno =
            `${meses[agora.getMonth()]} de ${agora.getFullYear()}`;

        const transferenciaResult = await client.query(
            `
            INSERT INTO transferencias
            (
                lote_contexto,
                ordem_contexto,
                mes_ano
            )

            VALUES ($1,$2,$3)

            RETURNING id
            `,
            [
                loteContexto,
                ordemContexto,
                mesAno
            ]
        );

        const transferenciaId =
            transferenciaResult.rows[0].id;

        // ==========================
        // ENTRADAS
        // ==========================

        for (const entrada of entradas) {

            await client.query(
                `
                INSERT INTO transferencias_entradas
                (
                    transferencia_id,
                    material,
                    ordem_origem,
                    quantidade
                )

                VALUES ($1,$2,$3,$4)
                `,
                [
                    transferenciaId,
                    entrada.material,
                    entrada.ordemOrigem,
                    entrada.quantidade
                ]
            );
        }

        // ==========================
        // SAÍDAS
        // ==========================

        for (const saida of saidas) {

            await client.query(
                `
                INSERT INTO transferencias_saidas
                (
                    transferencia_id,
                    material,
                    ordem_destino,
                    lote_material,
                    quantidade
                )

                VALUES ($1,$2,$3,$4,$5)
                `,
                [
                    transferenciaId,
                    saida.material,
                    saida.ordemDestino,
                    saida.loteMaterial,
                    saida.quantidade
                ]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Transferências salvas!'
        });

    } catch (err) {

        await client.query('ROLLBACK');

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'Erro ao salvar transferências'
        });

    } finally {

        client.release();
    }
});


// ==========================
// BUSCAR TRANSFERÊNCIAS
// ==========================

app.get('/transferencias', async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM transferencias
            ORDER BY id DESC
        `);

        const transferencias = result.rows;

        for (const transf of transferencias) {

            const entradas = await pool.query(
                `
                SELECT *
                FROM transferencias_entradas
                WHERE transferencia_id = $1
                `,
                [transf.id]
            );

            const saidas = await pool.query(
                `
                SELECT *
                FROM transferencias_saidas
                WHERE transferencia_id = $1
                `,
                [transf.id]
            );

            transf.entradas = entradas.rows;
            transf.saidas = saidas.rows;
        }

        res.json(transferencias);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            erro: 'Erro ao buscar transferências'
        });
    }
});
// ========================================
// APAGAR TODO HISTÓRICO DE TRANSFERÊNCIAS
// ========================================

app.delete('/transferencias/apagar', async (req, res) => {

    try {

        await pool.query(`
            DELETE FROM transferencia_entradas
        `);

        await pool.query(`
            DELETE FROM transferencia_saidas
        `);

        await pool.query(`
            DELETE FROM transferencias
        `);

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'Erro ao apagar histórico'
        });
    }
});