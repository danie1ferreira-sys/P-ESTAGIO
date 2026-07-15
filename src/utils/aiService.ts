export interface AIAttributeDefinition {
  key: string;
  label: string;
  instruction: string;
}

/**
 * Registry of fields extracted by AI.
 * Easily extensible to add new fields in the future (e.g. system, module, category).
 */
export const AI_EXTRACTABLE_FIELDS: AIAttributeDefinition[] = [
  {
    key: 'description',
    label: 'Descrição do Atendimento',
    instruction: 'Descreva de forma técnica, objetiva e profissional o problema relatado pelo cliente (identificando cliente e suporte), todas as ações realizadas e o resultado final. Não faça um simples resumo nem copie diálogos da conversa. Exemplo: "O usuário informou dificuldades para acessar o módulo Contabilidade. Foi realizada análise do cadastro e das permissões de acesso, identificando ausência do perfil necessário. Após os ajustes realizados, foi solicitado novo acesso ao sistema, sendo confirmado o funcionamento normal."'
  },
  {
    key: 'solution',
    label: 'Solução Aplicada',
    instruction: 'Descreva a solução aplicada de forma técnica e sucinta. Exemplo: "Realizada liberação das permissões de acesso ao módulo Contabilidade, com validação do funcionamento após novo login. Atendimento concluído com sucesso."'
  }
];

/**
 * Analyzes the ticket conversation using Gemini API.
 */
export async function analyzeConversation(
  conversation: string,
  apiKey: string
): Promise<Record<string, string>> {
  if (!apiKey.trim()) {
    throw new Error('Chave de API do Gemini não configurada no painel do administrador.');
  }

  const prompt = `Analise toda a conversa fornecida. Identifique o problema relatado, todas as ações executadas pelo suporte e o resultado final do atendimento.
Você é um especialista em suporte técnico e deve preencher os campos para registro em um sistema de chamados.
Seus textos devem ser claros, técnicos, objetivos e adequados para registro em um sistema de chamados.
Não copie a conversa.
Não faça resumo.
Interprete o atendimento.
Nunca invente informações.
Se houver acesso remoto, ligação telefônica ou outro meio de suporte, mencione apenas se estiver explicitamente presente na conversa.

Instruções Adicionais de Análise:
- Leia TODA a conversa fornecida.
- Identifique quem é o cliente e quem é o suporte.
- Descubra qual era o problema inicial.
- Identifique todas as ações executadas pelo suporte.
- Identifique se houve explicitamente algum dos seguintes eventos (mencione apenas se estiverem explicitamente presentes na conversa):
  - acesso remoto
  - ligação
  - orientação
  - criação de usuário
  - alteração de permissões
  - parametrização
  - atualização
  - correção
  - treinamento
  - liberação
  - exportação
  - importação
- Identifique o resultado final do atendimento.
- Se alguma informação não existir, simplesmente não a mencione.

Para cada campo, siga rigorosamente a instrução abaixo:
${AI_EXTRACTABLE_FIELDS.map(f => `- ${f.key} (${f.label}): ${f.instruction}`).join('\n')}

Retorne obrigatoriamente um objeto JSON com o seguinte formato estruturado:
{
  ${AI_EXTRACTABLE_FIELDS.map(f => `"${f.key}": "string"`).join(',\n  ')}
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\nConversa a ser analisada:\n${conversation}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(errMsg);
    }

    const resData = await response.json();
    const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Nenhuma resposta retornada da IA.');
    }

    const parsed = JSON.parse(text.trim());
    
    // Validate output format & fallbacks
    const result: Record<string, string> = {};
    for (const field of AI_EXTRACTABLE_FIELDS) {
      result[field.key] = typeof parsed[field.key] === 'string' ? parsed[field.key].trim() : '';
    }
    return result;
  } catch (error) {
    console.error('Erro na análise da conversa com Gemini:', error);
    throw error instanceof Error ? error : new Error('Falha ao processar a conversa.');
  }
}
