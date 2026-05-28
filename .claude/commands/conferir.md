# /conferir — Validação End-to-End de Feature

Quando este comando for usado, execute a regra de validação completa antes de declarar qualquer feature como "pronta".

## Regra obrigatória

Para cada feature mencionada ou mostrada (print, descrição, nome), verificar os 4 elos em sequência:

1. **Frontend chama** — o botão/ação dispara a chamada de API correta? (`api.ts`, `useMutation`, `fetch`)
2. **Backend tem rota** — a rota existe no Express? (`routes/*.js`) Retorna o status correto?
3. **Rota lê o campo** — o campo salvo/lido existe no banco? (Supabase tabela + coluna confirmados)
4. **Comportamento muda** — a mudança de fato altera o funcionamento do sistema? (ex: `discagem_simultanea` realmente controla o `Promise.all` no `telnyx.js`)

## Se qualquer elo quebrar

- Marcar como ⚠️ **Pendente** com o elo específico que falhou
- Implementar o elo faltante antes de avançar
- Só marcar ✅ **Pronto** após todos os 4 elos confirmados

## Formato do laudo

Para cada feature auditada:

```
[nome da feature]
  1. Frontend chama?     ✅ / ⚠️ [onde está o problema]
  2. Backend tem rota?   ✅ / ⚠️ [onde está o problema]
  3. Rota lê o campo?    ✅ / ⚠️ [onde está o problema]
  4. Comportamento muda? ✅ / ⚠️ [onde está o problema]
  Status: ✅ PRONTO / ⚠️ PENDENTE — [elo faltante]
```

## Input esperado

O usuário pode passar:
- Nome de uma feature: `/conferir agressividade`
- Print de uma tela: `/conferir [imagem]`
- Nome de um módulo inteiro: `/conferir módulo campanhas`
- Sem argumento: audita a última feature discutida na sessão

Ao receber o input, leia os arquivos relevantes (routes, api.ts, types) antes de responder — não assuma que está funcionando sem verificar o código.
